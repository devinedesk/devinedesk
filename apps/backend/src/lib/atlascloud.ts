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
 * Atlas Cloud provider — OpenAI-compatible API aggregating 400+ AI models
 * (video, image, LLM, audio, 3D) behind a single key.
 *
 * Used as a provider option alongside OpenRouter and Vertex AI. Selected via
 * `AI_PROVIDER=atlascloud`. Particularly cost-effective when combined with
 * the Atlas Cloud Open Source Sponsorship Program (free monthly credits for
 * active open-source projects — see https://www.atlascloud.ai/oss-program).
 *
 * API reference:
 *   - Media Generation: https://api.atlascloud.ai/api/v1
 *   - LLM (OpenAI-compat): https://api.atlascloud.ai/v1
 *   - Video: POST /api/v1/model/generateVideo → poll GET /api/v1/model/prediction/{id}
 *   - Image: POST /api/v1/model/generateImage → poll GET /api/v1/model/prediction/{id}
 *
 * Image and video generation are asynchronous: submit → get prediction_id →
 * poll until status is "completed"/"succeeded" → download from outputs URL.
 */

const MEDIA_BASE = "https://api.atlascloud.ai/api/v1";

function authHeaders(): Record<string, string> {
  if (!env.ATLASCLOUD_API_KEY) {
    throw new Error(
      "ATLASCLOUD_API_KEY is not configured. Set it in the backend .env to use Atlas Cloud.",
    );
  }
  return {
    Authorization: `Bearer ${env.ATLASCLOUD_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Model listing
// ---------------------------------------------------------------------------

interface AtlasModel {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  supported_resolutions?: string[];
  supported_aspect_ratios?: string[];
  supported_durations?: number[];
  supportsReferences?: boolean;
}

interface AtlasModelsResponse {
  data?: AtlasModel[];
}

/** List video-generation models available on Atlas Cloud. */
export async function listVideoModels(): Promise<VideoModel[]> {
  const res = await fetch(`${MEDIA_BASE}/models?type=video`, {
    headers: env.ATLASCLOUD_API_KEY ? authHeaders() : { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to list Atlas Cloud video models: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as AtlasModelsResponse;
  return (json.data ?? []).map((m) => ({
    id: m.id,
    name: m.name ?? m.id,
    description: m.description,
    supported_resolutions: m.supported_resolutions,
    supported_aspect_ratios: m.supported_aspect_ratios,
    supported_durations: m.supported_durations,
    supportsReferences: m.supportsReferences,
  }));
}

/** List image-generation models available on Atlas Cloud. */
export async function listImageModels(): Promise<VideoModel[]> {
  const res = await fetch(`${MEDIA_BASE}/models?type=image`, {
    headers: env.ATLASCLOUD_API_KEY ? authHeaders() : { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to list Atlas Cloud image models: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as AtlasModelsResponse;
  return (json.data ?? []).map((m) => ({
    id: m.id,
    name: m.name ?? m.id,
    description: m.description,
    supported_resolutions: m.supported_resolutions,
    supported_aspect_ratios: m.supported_aspect_ratios,
    supportsReferences: m.supportsReferences,
  }));
}

// ---------------------------------------------------------------------------
// Prediction polling
// ---------------------------------------------------------------------------

interface PredictionResponse {
  code?: number;
  data?: {
    id: string;
    status: "processing" | "completed" | "succeeded" | "failed";
    outputs?: string[];
    error?: string;
    usage?: { cost?: number };
  };
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll the prediction endpoint until the job reaches a terminal state.
 * Returns the outputs (URLs) and optional cost.
 */
async function pollPrediction(predictionId: string): Promise<{
  outputs: string[];
  cost?: number;
}> {
  const deadline = Date.now() + MAX_POLL_MS;
  const pollUrl = `${MEDIA_BASE}/model/prediction/${predictionId}`;

  while (true) {
    if (Date.now() > deadline) {
      throw new Error(`Atlas Cloud prediction ${predictionId} timed out after ${MAX_POLL_MS / 1000}s`);
    }
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(pollUrl, { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`Atlas Cloud poll failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as PredictionResponse;
    const data = json.data;
    if (!data) {
      throw new Error(`Atlas Cloud poll returned no data for prediction ${predictionId}`);
    }
    if (data.status === "completed" || data.status === "succeeded") {
      if (!data.outputs || data.outputs.length === 0) {
        throw new Error(`Atlas Cloud prediction ${predictionId} completed with no outputs`);
      }
      return { outputs: data.outputs, cost: data.usage?.cost };
    }
    if (data.status === "failed") {
      throw new Error(data.error ?? `Atlas Cloud prediction ${predictionId} failed`);
    }
    // Still processing — keep polling.
  }
}

/** Download content from a URL and return the buffer + content type. */
async function downloadContent(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download Atlas Cloud output: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

// ---------------------------------------------------------------------------
// Video generation
// ---------------------------------------------------------------------------

interface AtlasVideoSubmitResponse {
  code?: number;
  data?: { id: string; status: string };
}

/** Generate a video via Atlas Cloud (async: submit → poll → download). */
export async function generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
  };
  if (params.duration) body.duration = params.duration;
  if (params.resolution) body.resolution = params.resolution;
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
  if (params.generateAudio !== undefined) body.generate_audio = params.generateAudio;

  // Atlas Cloud uses "images" for frame images (image-to-video models).
  const images: string[] = [];
  if (params.firstFrame) images.push(params.firstFrame.url);
  if (params.lastFrame) images.push(params.lastFrame.url);
  if (images.length > 0) body.images = images;

  // Reference images for reference-to-video models.
  if (params.references && params.references.length > 0) {
    body.references = params.references.map((r) => r.url);
  }

  const submitRes = await fetch(`${MEDIA_BASE}/model/generateVideo`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    throw new Error(`Atlas Cloud video submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  const submitted = (await submitRes.json()) as AtlasVideoSubmitResponse;
  const predictionId = submitted.data?.id;
  if (!predictionId) {
    throw new Error("Atlas Cloud video submit returned no prediction id");
  }

  const { outputs, cost } = await pollPrediction(predictionId);
  const { buffer, contentType } = await downloadContent(outputs[0]!);

  return {
    buffer,
    contentType: contentType || "video/mp4",
    providerJobId: predictionId,
    cost,
  };
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

interface AtlasImageSubmitResponse {
  code?: number;
  data?: { id: string; status: string };
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

/** Generate an image via Atlas Cloud (async: submit → poll → download). */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
  };
  if (params.resolution) body.resolution = params.resolution;
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
  if (params.references && params.references.length > 0) {
    body.images = params.references.map((r) => r.url);
  }

  const submitRes = await fetch(`${MEDIA_BASE}/model/generateImage`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    throw new Error(`Atlas Cloud image submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  const submitted = (await submitRes.json()) as AtlasImageSubmitResponse;
  const predictionId = submitted.data?.id;
  if (!predictionId) {
    throw new Error("Atlas Cloud image submit returned no prediction id");
  }

  const { outputs, cost } = await pollPrediction(predictionId);
  const { buffer, contentType } = await downloadContent(outputs[0]!);

  return {
    buffer,
    contentType: contentType || detectImageContentType(buffer),
    cost,
  };
}

// ---------------------------------------------------------------------------
// Face swap via image-edit model
// ---------------------------------------------------------------------------

const asDataUrl = (buffer: Buffer, mime: string) => `data:${mime};base64,${buffer.toString("base64")}`;

/**
 * Face swap via a diffusion image-edit model on Atlas Cloud (e.g. FLUX, Nano
 * Banana). The frame is the base image and the avatar is a reference, so the
 * model re-renders the frame with the person's face. Accepts a `context` prompt.
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
// Swap model listing (for the admin model picker)
// ---------------------------------------------------------------------------

export interface SwapModelOption {
  id: string;
  name: string;
  local: boolean;
}

/** Face-swap models: local FaceFusion + Atlas Cloud image models that accept references. */
export async function listSwapModels(): Promise<SwapModelOption[]> {
  const images = await listImageModels();
  const atlascloud = images
    .filter((m) => m.supportsReferences)
    .map((m) => ({ id: m.id, name: m.name, local: false }));
  return [{ id: "facefusion", name: "FaceFusion (local)", local: true }, ...atlascloud];
}
