import { env } from "../env.js";
import type {
  VideoModel,
  GenerateVideoParams,
  GeneratedVideo,
  GenerateImageParams,
  GeneratedImage,
  SwapFaceParams,
} from "./openrouter.js";

/**
 * Vertex AI / Gemini API provider — Google's native generative AI service.
 *
 * Uses two Google APIs:
 *  1. Gemini API (generativelanguage.googleapis.com) — when GEMINI_API_KEY is set.
 *     Has Veo 3.1 video generation and Gemini image models (gemini-2.5-flash-image,
 *     gemini-3.1-flash-image, nano-banana-pro-preview). Uses separate prepayment
 *     credits (NOT GCP $300 free trial credits). Create a key at:
 *     https://aistudio.google.com/apikey
 *  2. Vertex AI API (aiplatform.googleapis.com) — fallback when GEMINI_API_KEY is
 *     not set. Uses GCP access token (from `gcloud auth print-access-token` or the
 *     GCE metadata server). Has Imagen and Veo models, but these may not be
 *     available on the GCP free trial. Covered by GCP $300 credits + Google for
 *     Startups Cloud Program.
 *
 * Selected via `AI_PROVIDER=vertex`.
 *
 * API references:
 *   - Video: POST .../publishers/google/models/MODEL:predictLongRunning
 *     → long-running operation → poll → download from GCS
 *   - Image: POST .../publishers/google/models/MODEL:predict
 *     → synchronous response with base64-encoded images
 */

const VERTEX_BASE = "https://us-central1-aiplatform.googleapis.com/v1";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Whether to use the Gemini API (Google AI Studio) vs Vertex AI. */
const useGeminiApi = (): boolean => !!env.GEMINI_API_KEY;

// ---------------------------------------------------------------------------
// Authentication — get an OAuth2 access token
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get a Google Cloud OAuth2 access token. Uses the metadata server when
 * running on a GCP VM, or the service account key when configured locally.
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer).
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  // If a service account key is provided as JSON, exchange it for an access token.
  if (env.GCP_SERVICE_ACCOUNT_KEY) {
    // Use Google's JWT flow. We construct a signed JWT and exchange it.
    // For simplicity in a serverless/VM context, we use the metadata server
    // when available, and fall back to the gcloud CLI token otherwise.
    // In production on a GCP VM, the metadata server is the primary path.
    throw new Error(
      "GCP_SERVICE_ACCOUNT_KEY is set but JWT signing is not implemented in this module. " +
        "When running on a GCP VM, unset GCP_SERVICE_ACCOUNT_KEY and the metadata server " +
        "will be used automatically. For local dev, run `gcloud auth print-access-token` " +
        "and set it as VERTEX_ACCESS_TOKEN in your .env.",
    );
  }

  // If a static access token is provided (e.g. from `gcloud auth print-access-token`).
  if (env.VERTEX_ACCESS_TOKEN) {
    cachedToken = { token: env.VERTEX_ACCESS_TOKEN, expiresAt: Date.now() + 55 * 60 * 1000 };
    return cachedToken.token;
  }

  // Use the GCP metadata server (works on GCP VMs and in GCP containers).
  const metaRes = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  );
  if (!metaRes.ok) {
    throw new Error(
      "Failed to get GCP access token from metadata server. " +
        "Set VERTEX_ACCESS_TOKEN (from `gcloud auth print-access-token`) or run on a GCP VM.",
    );
  }
  const metaJson = (await metaRes.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: metaJson.access_token,
    expiresAt: Date.now() + metaJson.expires_in * 1000,
  };
  return cachedToken.token;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}

function projectId(): string {
  if (!env.GCP_PROJECT_ID) {
    throw new Error("GCP_PROJECT_ID is not configured. Set it in the backend .env for Vertex AI.");
  }
  return env.GCP_PROJECT_ID;
}

// ---------------------------------------------------------------------------
// Model listing — static lists for known Google models
// ---------------------------------------------------------------------------

const VERTEX_VIDEO_MODELS: VideoModel[] = [
  // Gemini API models (generativelanguage.googleapis.com)
  {
    id: "veo-3.1-generate-preview",
    name: "Veo 3.1",
    description: "Google Veo 3.1 — latest high-quality video generation (Gemini API)",
    supported_resolutions: ["720p", "1080p"],
    supported_aspect_ratios: ["16:9", "9:16", "1:1"],
    supported_durations: [4, 6, 8],
  },
  {
    id: "veo-3.1-fast-generate-preview",
    name: "Veo 3.1 Fast",
    description: "Google Veo 3.1 Fast — fast, affordable video generation (Gemini API)",
    supported_resolutions: ["720p", "1080p"],
    supported_aspect_ratios: ["16:9", "9:16", "1:1"],
    supported_durations: [4, 6, 8],
  },
  {
    id: "veo-3.1-lite-generate-preview",
    name: "Veo 3.1 Lite",
    description: "Google Veo 3.1 Lite — most affordable video generation (Gemini API)",
    supported_resolutions: ["720p", "1080p"],
    supported_aspect_ratios: ["16:9", "9:16", "1:1"],
    supported_durations: [4, 6, 8],
  },
  // Vertex AI models (aiplatform.googleapis.com)
  {
    id: "veo-3.0-fast-generate-001",
    name: "Veo 3 Fast (Vertex AI)",
    description: "Google Veo 3 Fast — fast video generation via Vertex AI",
    supported_resolutions: ["720p", "1080p"],
    supported_aspect_ratios: ["16:9", "9:16", "1:1"],
    supported_durations: [4, 6, 8],
  },
  {
    id: "veo-3.0-generate-001",
    name: "Veo 3 (Vertex AI)",
    description: "Google Veo 3 — high-quality video generation via Vertex AI",
    supported_resolutions: ["720p", "1080p"],
    supported_aspect_ratios: ["16:9", "9:16", "1:1"],
    supported_durations: [4, 6, 8],
  },
];

const VERTEX_IMAGE_MODELS: VideoModel[] = [
  // Gemini API image models (generativelanguage.googleapis.com)
  {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    description: "Google Gemini 2.5 Flash — fast image generation (Gemini API)",
    supported_resolutions: ["1024x1024"],
    supported_aspect_ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  {
    id: "gemini-3.1-flash-image",
    name: "Gemini 3.1 Flash Image",
    description: "Google Gemini 3.1 Flash — latest image generation (Gemini API)",
    supported_resolutions: ["1024x1024"],
    supported_aspect_ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  {
    id: "gemini-3-pro-image",
    name: "Gemini 3 Pro Image",
    description: "Google Gemini 3 Pro — highest quality image generation (Gemini API)",
    supported_resolutions: ["1024x1024"],
    supported_aspect_ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  {
    id: "nano-banana-pro-preview",
    name: "Nano Banana Pro",
    description: "Google Nano Banana Pro — high-quality image generation (Gemini API)",
    supported_resolutions: ["1024x1024"],
    supported_aspect_ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  // Vertex AI Imagen models (aiplatform.googleapis.com)
  {
    id: "imagen-4.0-fast-generate-001",
    name: "Imagen 4 Fast (Vertex AI)",
    description: "Google Imagen 4 Fast — fast image generation via Vertex AI",
    supported_resolutions: ["1024x1024", "1280x1280", "1792x1792", "768x1408", "1408x768"],
    supported_aspect_ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  {
    id: "imagen-4.0-generate-001",
    name: "Imagen 4 (Vertex AI)",
    description: "Google Imagen 4 — balanced quality image generation via Vertex AI",
    supported_resolutions: ["1024x1024", "1280x1280", "1792x1792", "768x1408", "1408x768"],
    supported_aspect_ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
];

/** List video-generation models available on Vertex AI. */
export async function listVideoModels(): Promise<VideoModel[]> {
  return VERTEX_VIDEO_MODELS;
}

/** List image-generation models available on Vertex AI. */
export async function listImageModels(): Promise<VideoModel[]> {
  return VERTEX_IMAGE_MODELS;
}

// ---------------------------------------------------------------------------
// Video generation — Veo (async long-running operation)
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface LroResponse {
  name: string;
  done?: boolean;
  error?: { code?: number; message?: string };
  response?: {
    videos?: { uri: string; gcsUri?: string }[];
  };
}

/** Generate a video via Gemini API (Veo 3.1) or Vertex AI (Veo 3.0). */
export async function generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
  // --- Gemini API path (generativelanguage.googleapis.com) ---
  if (useGeminiApi()) {
    const url = `${GEMINI_BASE}/models/${params.model}:predictLongRunning?key=${env.GEMINI_API_KEY}`;
    const instance: Record<string, unknown> = { prompt: params.prompt };
    const parameters: Record<string, unknown> = { sampleCount: 1 };
    if (params.aspectRatio) parameters.aspectRatio = params.aspectRatio;
    if (params.resolution) parameters.resolution = params.resolution;
    if (params.duration) parameters.durationSeconds = params.duration;
    if (params.generateAudio !== undefined) parameters.generateAudio = params.generateAudio;
    const body = { instances: [instance], parameters };

    const submitRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!submitRes.ok) {
      throw new Error(`Gemini API video submit failed: ${submitRes.status} ${await submitRes.text()}`);
    }
    const lro = (await submitRes.json()) as LroResponse;
    const operationName = lro.name;

    // Poll the long-running operation.
    const deadline = Date.now() + MAX_POLL_MS;
    const pollUrl = `${GEMINI_BASE}/${operationName}?key=${env.GEMINI_API_KEY}`;
    let operation: LroResponse = lro;
    while (!operation.done) {
      if (Date.now() > deadline) {
        throw new Error(`Gemini API video generation timed out after ${MAX_POLL_MS / 1000}s`);
      }
      await sleep(POLL_INTERVAL_MS);
      const pollRes = await fetch(pollUrl);
      if (!pollRes.ok) {
        throw new Error(`Gemini API poll failed: ${pollRes.status} ${await pollRes.text()}`);
      }
      operation = (await pollRes.json()) as LroResponse;
    }

    if (operation.error) {
      throw new Error(operation.error.message ?? "Gemini API video generation failed");
    }

    const videoUri = operation.response?.videos?.[0]?.gcsUri ?? operation.response?.videos?.[0]?.uri;
    if (!videoUri) {
      throw new Error("Gemini API video generation completed with no output URI");
    }

    // Download the video.
    const gcsHttpUrl = videoUri.replace("gs://", "https://storage.googleapis.com/");
    const videoRes = await fetch(gcsHttpUrl);
    if (!videoRes.ok) {
      throw new Error(`Failed to download video from GCS: ${videoRes.status}`);
    }
    const arrayBuffer = await videoRes.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: videoRes.headers.get("content-type") ?? "video/mp4",
      providerJobId: operationName,
    };
  }

  // --- Vertex AI path (aiplatform.googleapis.com) ---
  const token = await getAccessToken();
  const pid = projectId();
  const modelId = params.model;
  const url = `${VERTEX_BASE}/projects/${pid}/locations/us-central1/publishers/google/models/${modelId}:predictLongRunning`;

  // Build the instances array. Veo accepts a prompt and optional image (GCS URI).
  const instance: Record<string, unknown> = { prompt: params.prompt };
  // Frame images: Vertex AI expects GCS URIs, not data URLs. For now, we
  // support text-to-video. Image-to-video requires uploading to GCS first.
  // (The caller would need to upload frames to a GCS bucket and pass the URI.)

  const parameters: Record<string, unknown> = {
    storageUri: env.VERTEX_GCS_OUTPUT_URI || `gs://${pid}-vertex-ai-output/`,
    sampleCount: 1,
  };
  if (params.aspectRatio) parameters.aspectRatio = params.aspectRatio;
  if (params.resolution) parameters.resolution = params.resolution;
  if (params.duration) parameters.durationSeconds = params.duration;
  if (params.generateAudio !== undefined) parameters.generateAudio = params.generateAudio;

  const body = { instances: [instance], parameters };

  const submitRes = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    throw new Error(`Vertex AI video submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  const lro = (await submitRes.json()) as LroResponse;
  const operationName = lro.name;

  // Poll the long-running operation until done.
  const deadline = Date.now() + MAX_POLL_MS;
  const pollUrl = `${VERTEX_BASE}/${operationName}`;
  let operation: LroResponse = lro;
  while (!operation.done) {
    if (Date.now() > deadline) {
      throw new Error(`Vertex AI video generation timed out after ${MAX_POLL_MS / 1000}s`);
    }
    await sleep(POLL_INTERVAL_MS);
    const pollRes = await fetch(pollUrl, { headers: authHeaders(token) });
    if (!pollRes.ok) {
      throw new Error(`Vertex AI poll failed: ${pollRes.status} ${await pollRes.text()}`);
    }
    operation = (await pollRes.json()) as LroResponse;
  }

  if (operation.error) {
    throw new Error(operation.error.message ?? "Vertex AI video generation failed");
  }

  const videoUri = operation.response?.videos?.[0]?.gcsUri ?? operation.response?.videos?.[0]?.uri;
  if (!videoUri) {
    throw new Error("Vertex AI video generation completed with no output URI");
  }

  // Download the video from GCS (the URI is a gs:// URI — fetch via the GCS API).
  const gcsHttpUrl = videoUri.replace("gs://", "https://storage.googleapis.com/");
  const videoRes = await fetch(gcsHttpUrl, { headers: authHeaders(token) });
  if (!videoRes.ok) {
    throw new Error(`Failed to download Vertex AI video from GCS: ${videoRes.status}`);
  }
  const arrayBuffer = await videoRes.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: videoRes.headers.get("content-type") ?? "video/mp4",
    providerJobId: operationName,
  };
}

// ---------------------------------------------------------------------------
// Image generation — Imagen (synchronous predict)
// ---------------------------------------------------------------------------

interface ImagenPredictResponse {
  predictions?: {
    bytesBase64Encoded?: string;
    mimeType?: string;
  }[];
}

/** Guess an image content type from the leading bytes of the buffer. */
function detectImageContentType(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return "image/png";
}

/** Generate an image via Gemini API (gemini-2.5-flash-image) or Vertex AI (Imagen). */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  // --- Gemini API path (generativelanguage.googleapis.com) ---
  if (useGeminiApi()) {
    const url = `${GEMINI_BASE}/models/${params.model}:generateContent?key=${env.GEMINI_API_KEY}`;
    const parts: Record<string, unknown>[] = [{ text: params.prompt }];
    // Include reference images if provided (for face swap / image-to-image).
    if (params.references) {
      for (const ref of params.references) {
        // ref.url is a data URL: data:image/png;base64,....
        const match = ref.url.match(/^data:(.+?);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
    }
    const body = {
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Gemini API image generation failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string; inlineData?: { mimeType?: string; data?: string } }[] } }[];
    };
    const responseParts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error("Gemini API image generation returned no image data");
    }
    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    return {
      buffer,
      contentType: imagePart.inlineData.mimeType ?? detectImageContentType(buffer),
    };
  }

  // --- Vertex AI path (aiplatform.googleapis.com) ---
  const token = await getAccessToken();
  const pid = projectId();
  const modelId = params.model;
  const url = `${VERTEX_BASE}/projects/${pid}/locations/us-central1/publishers/google/models/${modelId}:predict`;

  const instance: Record<string, unknown> = { prompt: params.prompt };
  const parameters: Record<string, unknown> = { sampleCount: 1 };
  if (params.aspectRatio) parameters.aspectRatio = params.aspectRatio;

  const body = { instances: [instance], parameters };

  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Vertex AI image generation failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as ImagenPredictResponse;
  const first = json.predictions?.[0];
  if (!first?.bytesBase64Encoded) {
    throw new Error("Vertex AI image generation returned no image data");
  }
  const buffer = Buffer.from(first.bytesBase64Encoded, "base64");
  return {
    buffer,
    contentType: first.mimeType ?? detectImageContentType(buffer),
  };
}

// ---------------------------------------------------------------------------
// Face swap via Imagen (not directly supported — falls back to image edit)
// ---------------------------------------------------------------------------

const asDataUrl = (buffer: Buffer, mime: string) => `data:${mime};base64,${buffer.toString("base64")}`;

/**
 * Face swap via Vertex AI. Imagen doesn't have a direct "swap face" endpoint,
 * but we can use it as an image-edit model by including reference images in
 * the prompt. This is a best-effort implementation — for production face
 * swaps, the FaceFusion self-hosted service is recommended.
 */
export async function swapFaceWithImageModel(params: SwapFaceParams): Promise<GeneratedImage> {
  const base =
    "You are given two images. IMAGE 1 is the scene to edit. IMAGE 2 is a reference photo of a " +
    "different person. Task: change the identity of the main face in IMAGE 1 so it becomes the " +
    "person from IMAGE 2 — copy IMAGE 2's facial features, bone structure, eyes, nose, mouth and " +
    "overall likeness. " +
    "Keep EVERYTHING ELSE from IMAGE 1 unchanged: the body, pose, the existing hair and beard, " +
    "clothing, framing, camera angle, lighting and background. " +
    "Do NOT import the hair, beard, glasses/sunglasses or accessories from IMAGE 2, and do not add " +
    "any that aren't already in IMAGE 1. " +
    "Match the skin tone and color to IMAGE 1's lighting so the face blends seamlessly. " +
    "Output a photorealistic result with a natural, neutral expression and change nothing other " +
    "than the facial identity. Preserve IMAGE 1's exact framing and aspect ratio.";
  const prompt = params.context?.trim()
    ? `${base}\n\nAdditional guidance from the creator: ${params.context.trim()}`
    : base;
  return generateImage({
    model: params.model,
    prompt,
    aspectRatio: params.aspectRatio,
    references: [
      { url: asDataUrl(params.frame.buffer, params.frame.mime) },
      { url: asDataUrl(params.face.buffer, params.face.mime) },
    ],
  });
}

// ---------------------------------------------------------------------------
// Swap model listing
// ---------------------------------------------------------------------------

export interface SwapModelOption {
  id: string;
  name: string;
  local: boolean;
}

/** Face-swap models: local FaceFusion + Vertex AI image models. */
export async function listSwapModels(): Promise<SwapModelOption[]> {
  return [
    { id: "facefusion", name: "FaceFusion (local)", local: true },
    ...VERTEX_IMAGE_MODELS.map((m) => ({ id: m.id, name: m.name, local: false })),
  ];
}
