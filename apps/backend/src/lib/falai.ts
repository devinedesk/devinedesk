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
 * fal.ai provider — 1,000+ AI models (video, image, audio, 3D) behind a single
 * queue-based REST API.
 *
 * Used as a provider option alongside OpenRouter, Atlas Cloud, and Vertex AI.
 * Selected via `AI_PROVIDER=fal`. Cost-effective when combined with the fal.ai
 * Builder Grant ($25–$250 for indie builders) or Startup Program ($1,000–$5,000
 * for scaling startups) — see https://fal.ai/startups.
 *
 * API reference:
 *   - Queue API:  https://queue.fal.run/{model_owner}/{model_name}
 *   - Platform:   https://api.fal.ai/v1
 *   - Auth:       Authorization: Key YOUR_API_KEY
 *
 * Generation flow (async queue):
 *   1. POST https://queue.fal.run/{model_id} → { request_id, status_url, response_url }
 *   2. GET  {status_url}                     → { status: IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED }
 *   3. GET  {response_url}                   → model output (video URL or image URLs)
 *
 * Model IDs are endpoint paths like "bytedance/seedance-2.0/text-to-video" or
 * "fal-ai/flux/schnell" — the model ID stored in the DB IS the fal.ai endpoint.
 */

const QUEUE_BASE = "https://queue.fal.run";
const PLATFORM_BASE = "https://api.fal.ai/v1";

function authHeaders(): Record<string, string> {
  if (!env.FAL_API_KEY) {
    throw new Error(
      "FAL_API_KEY is not configured. Set it in the backend .env to use fal.ai.",
    );
  }
  return {
    Authorization: `Key ${env.FAL_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Model listing
// ---------------------------------------------------------------------------

interface FalModel {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  capabilities?: string[];
}

interface FalModelsResponse {
  data?: FalModel[];
}

/**
 * Curated list of popular fal.ai video models, used as a fallback if the
 * platform API is unavailable or returns an unexpected format. Model IDs are
 * the full endpoint paths used in the queue URL.
 */
const CURATED_VIDEO_MODELS: VideoModel[] = [
  { id: "bytedance/seedance-2.0/text-to-video", name: "Seedance 2.0 (Text-to-Video)", supported_durations: [5, 10, 15], supported_resolutions: ["720p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "bytedance/seedance-2.0/image-to-video", name: "Seedance 2.0 (Image-to-Video)", supported_durations: [5, 10, 15], supported_resolutions: ["720p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"], supportsReferences: true },
  { id: "google/veo-3.1", name: "Google Veo 3.1", supported_durations: [4, 6, 8], supported_resolutions: ["720p", "1080p", "4K"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "google/veo-3.1/fast", name: "Google Veo 3.1 Fast", supported_durations: [4, 6, 8], supported_resolutions: ["720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "kling/kling-3-pro/text-to-video", name: "Kling 3.0 Pro (Text-to-Video)", supported_durations: [5, 10, 15], supported_resolutions: ["1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "kling/kling-3-pro/image-to-video", name: "Kling 3.0 Pro (Image-to-Video)", supported_durations: [5, 10, 15], supported_resolutions: ["1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"], supportsReferences: true },
  { id: "kling/kling-2-5-turbo-pro/text-to-video", name: "Kling 2.5 Turbo Pro (Text-to-Video)", supported_durations: [5, 10], supported_resolutions: ["720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "kling/kling-2-5-turbo-pro/image-to-video", name: "Kling 2.5 Turbo Pro (Image-to-Video)", supported_durations: [5, 10], supported_resolutions: ["720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"], supportsReferences: true },
  { id: "openai/sora-2", name: "OpenAI Sora 2", supported_durations: [5, 10, 15, 20], supported_resolutions: ["720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "openai/sora-2-pro", name: "OpenAI Sora 2 Pro", supported_durations: [5, 10, 15, 20, 25], supported_resolutions: ["720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "wan/wan-2.5/text-to-video", name: "Wan 2.5 (Text-to-Video)", supported_durations: [5, 10], supported_resolutions: ["480p", "720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "wan/wan-2.5/image-to-video", name: "Wan 2.5 (Image-to-Video)", supported_durations: [5, 10], supported_resolutions: ["480p", "720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"], supportsReferences: true },
  { id: "minimax/hailuo-02/standard/text-to-video", name: "MiniMax Hailuo 02 Standard", supported_durations: [5, 10], supported_resolutions: ["768p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
  { id: "minimax/hailuo-02/standard/image-to-video", name: "MiniMax Hailuo 02 Standard (Image-to-Video)", supported_durations: [5, 10], supported_resolutions: ["768p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"], supportsReferences: true },
  { id: "fal-ai/stable-video", name: "Stable Video Diffusion", supported_durations: [4], supported_resolutions: ["576p", "1024p"], supported_aspect_ratios: ["16:9", "9:16"], supportsReferences: true },
];

/**
 * Curated list of popular fal.ai image models, used as a fallback if the
 * platform API is unavailable.
 */
const CURATED_IMAGE_MODELS: VideoModel[] = [
  { id: "fal-ai/flux/schnell", name: "FLUX.1 [schnell]", supported_aspect_ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
  { id: "fal-ai/flux/dev", name: "FLUX.1 [dev]", supported_aspect_ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
  { id: "fal-ai/flux-pro/v1.1", name: "FLUX.1.1 [pro]", supported_aspect_ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
  { id: "fal-ai/flux-pro/v1.1-ultra", name: "FLUX.1.1 [pro] Ultra", supported_aspect_ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"], supportsReferences: true },
  { id: "fal-ai/nano-banana", name: "Nano Banana", supported_aspect_ratios: ["1:1", "16:9", "9:16"], supportsReferences: true },
  { id: "fal-ai/nano-banana-2", name: "Nano Banana 2", supported_aspect_ratios: ["1:1", "16:9", "9:16"], supportsReferences: true },
  { id: "fal-ai/nano-banana-pro", name: "Nano Banana Pro", supported_aspect_ratios: ["1:1", "16:9", "9:16"], supportsReferences: true },
  { id: "fal-ai/flux/kontext/pro", name: "FLUX Kontext Pro", supportsReferences: true },
  { id: "fal-ai/flux/kontext/max", name: "FLUX Kontext Max", supportsReferences: true },
  { id: "fal-ai/bytedance/seedream-4-0", name: "Seedream V4", supported_aspect_ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
  { id: "fal-ai/qwen-image", name: "Qwen Image", supportsReferences: true },
  { id: "fal-ai/ideogram/v2", name: "Ideogram V2", supported_aspect_ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
];

/** List video-generation models available on fal.ai. */
export async function listVideoModels(): Promise<VideoModel[]> {
  try {
    const res = await fetch(`${PLATFORM_BASE}/models?limit=200`, {
      headers: env.FAL_API_KEY ? authHeaders() : { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`fal.ai models API returned ${res.status}`);
    }
    const json = (await res.json()) as FalModelsResponse;
    const videoModels = (json.data ?? []).filter(
      (m) => m.type === "video" || m.capabilities?.includes("video") || /video|veo|kling|sora|seedance|wan|hailuo|stable-video/i.test(m.id),
    );
    if (videoModels.length === 0) {
      return CURATED_VIDEO_MODELS;
    }
    return videoModels.map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      description: m.description,
      supportsReferences: /image-to-video|kontext|nano-banana/i.test(m.id),
    }));
  } catch {
    // Platform API unavailable — return the curated list.
    return CURATED_VIDEO_MODELS;
  }
}

/** List image-generation models available on fal.ai. */
export async function listImageModels(): Promise<VideoModel[]> {
  try {
    const res = await fetch(`${PLATFORM_BASE}/models?limit=200`, {
      headers: env.FAL_API_KEY ? authHeaders() : { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`fal.ai models API returned ${res.status}`);
    }
    const json = (await res.json()) as FalModelsResponse;
    const imageModels = (json.data ?? []).filter(
      (m) => m.type === "image" || m.capabilities?.includes("image") || /flux|nano-banana|seedream|ideogram|qwen-image|sdxl|stable-diffusion/i.test(m.id),
    );
    if (imageModels.length === 0) {
      return CURATED_IMAGE_MODELS;
    }
    return imageModels.map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      description: m.description,
      supportsReferences: /kontext|nano-banana|qwen-image|flux-pro\/v1\.1-ultra/i.test(m.id),
    }));
  } catch {
    // Platform API unavailable — return the curated list.
    return CURATED_IMAGE_MODELS;
  }
}

// ---------------------------------------------------------------------------
// Queue polling
// ---------------------------------------------------------------------------

interface QueueSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
  cancel_url: string;
  queue_position?: number;
}

interface QueueStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  logs?: { message: string }[];
  queue_position?: number;
  error?: string;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Submit a request to the fal.ai queue and poll until completion.
 * Returns the raw result payload from the response_url.
 */
async function submitAndPoll(modelId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Step 1: submit
  const submitRes = await fetch(`${QUEUE_BASE}/${modelId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    throw new Error(`fal.ai submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  const submitted = (await submitRes.json()) as QueueSubmitResponse;
  const requestId = submitted.request_id;

  // Step 2: poll until terminal
  const deadline = Date.now() + MAX_POLL_MS;
  let status: QueueStatusResponse;
  while (true) {
    if (Date.now() > deadline) {
      throw new Error(`fal.ai request ${requestId} timed out after ${MAX_POLL_MS / 1000}s`);
    }
    await sleep(POLL_INTERVAL_MS);
    const statusRes = await fetch(submitted.status_url, { headers: authHeaders() });
    if (!statusRes.ok) {
      throw new Error(`fal.ai status poll failed: ${statusRes.status} ${await statusRes.text()}`);
    }
    status = (await statusRes.json()) as QueueStatusResponse;
    if (status.status === "COMPLETED") break;
    if (status.status === "FAILED") {
      throw new Error(status.error ?? `fal.ai request ${requestId} failed`);
    }
    // Still IN_QUEUE or IN_PROGRESS — keep polling.
  }

  // Step 3: fetch the result
  const resultRes = await fetch(submitted.response_url, { headers: authHeaders() });
  if (!resultRes.ok) {
    throw new Error(`fal.ai result fetch failed: ${resultRes.status} ${await resultRes.text()}`);
  }
  return (await resultRes.json()) as Record<string, unknown>;
}

/** Download content from a URL and return the buffer + content type. */
async function downloadContent(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download fal.ai output: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

// ---------------------------------------------------------------------------
// Video generation
// ---------------------------------------------------------------------------

/** Generate a video via fal.ai (async queue: submit → poll → download). */
export async function generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
  const body: Record<string, unknown> = {
    prompt: params.prompt,
  };
  if (params.duration) body.duration = params.duration;
  if (params.resolution) body.resolution = params.resolution;
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
  if (params.generateAudio !== undefined) body.generate_audio = params.generateAudio;

  // Image-to-video: pass the first frame as image_url.
  // fal.ai models accept image_url as a string (single image) or array.
  if (params.firstFrame) {
    body.image_url = params.firstFrame.url;
  }
  if (params.lastFrame) {
    // Some models accept an array of [first, last] frames.
    if (params.firstFrame) {
      body.image_url = [params.firstFrame.url, params.lastFrame.url];
    } else {
      body.image_url = params.lastFrame.url;
    }
  }

  // Reference images for reference-to-video models.
  if (params.references && params.references.length > 0) {
    body.reference_images = params.references.map((r) => r.url);
  }

  const result = await submitAndPoll(params.model, body);

  // fal.ai video results: { video: { url: "..." } } or { videos: [{ url: "..." }] }
  const videoUrl =
    (result.video as { url?: string })?.url ??
    (result.videos as { url?: string }[])?.[0]?.url;
  if (!videoUrl) {
    throw new Error("fal.ai video generation completed with no video URL");
  }

  const { buffer, contentType } = await downloadContent(videoUrl);

  return {
    buffer,
    contentType: contentType || "video/mp4",
    providerJobId: (result as { request_id?: string }).request_id ?? videoUrl,
  };
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

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

/** Generate an image via fal.ai (async queue: submit → poll → download). */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const body: Record<string, unknown> = {
    prompt: params.prompt,
  };
  if (params.resolution) {
    // fal.ai uses image_size (e.g. "1024x1024") or width/height.
    // If the resolution looks like a dimension string, pass it directly.
    if (/^\d+x\d+$/.test(params.resolution)) {
      body.image_size = params.resolution;
    } else {
      body.resolution = params.resolution;
    }
  }
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;

  // Reference images for image editing / reference-guided models.
  if (params.references && params.references.length > 0) {
    // fal.ai edit models accept image_url (single) or image_urls (array).
    if (params.references.length === 1) {
      body.image_url = params.references[0]!.url;
    } else {
      body.image_urls = params.references.map((r) => r.url);
    }
  }

  const result = await submitAndPoll(params.model, body);

  // fal.ai image results: { images: [{ url: "..." }] } or { image: { url: "..." } }
  const imageUrl =
    (result.images as { url?: string }[])?.[0]?.url ??
    (result.image as { url?: string })?.url;
  if (!imageUrl) {
    throw new Error("fal.ai image generation completed with no image URL");
  }

  const { buffer, contentType } = await downloadContent(imageUrl);

  return {
    buffer,
    contentType: contentType || detectImageContentType(buffer),
  };
}

// ---------------------------------------------------------------------------
// Face swap via image-edit model
// ---------------------------------------------------------------------------

const asDataUrl = (buffer: Buffer, mime: string) => `data:${mime};base64,${buffer.toString("base64")}`;

/**
 * Face swap via a diffusion image-edit model on fal.ai (e.g. FLUX Kontext,
 * Nano Banana). The frame is the base image and the avatar is a reference, so
 * the model re-renders the frame with the person's face. Accepts a `context` prompt.
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

/** Face-swap models: local FaceFusion + fal.ai image models that accept references. */
export async function listSwapModels(): Promise<SwapModelOption[]> {
  const images = await listImageModels();
  const fal = images
    .filter((m) => m.supportsReferences)
    .map((m) => ({ id: m.id, name: m.name, local: false }));
  return [{ id: "facefusion", name: "FaceFusion (local)", local: true }, ...fal];
}
