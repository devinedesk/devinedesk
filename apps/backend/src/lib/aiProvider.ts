import { env } from "../env.js";
import type {
  VideoModel,
  GenerateVideoParams,
  GeneratedVideo,
  GenerateImageParams,
  GeneratedImage,
  SwapFaceParams,
  SwapModelOption,
} from "./openrouter.js";
import * as openrouter from "./openrouter.js";
import * as atlascloud from "./atlascloud.js";
import * as vertexai from "./vertexai.js";

/**
 * AI provider router — dispatches generation + model-listing calls to the
 * provider selected by the `AI_PROVIDER` env var.
 *
 * Providers:
 *   - "openrouter" (default): OpenRouter — 400+ models, 5.5% platform fee
 *   - "atlascloud":           Atlas Cloud — 400+ models, OSS sponsorship credits
 *   - "vertex":               Vertex AI — Google native (Veo, Imagen), GCP credits
 *
 * Each provider module exports the same interface:
 *   listVideoModels, listImageModels, listSwapModels,
 *   generateVideo, generateImage, swapFaceWithImageModel
 *
 * This router re-exports the OpenRouter types (VideoModel, GenerateVideoParams,
 * etc.) as the shared interface all providers conform to.
 */

export type { VideoModel, GenerateVideoParams, GeneratedVideo, GenerateImageParams, GeneratedImage, SwapFaceParams, SwapModelOption };

type ProviderModule = {
  listVideoModels: () => Promise<VideoModel[]>;
  listImageModels: () => Promise<VideoModel[]>;
  listSwapModels: () => Promise<SwapModelOption[]>;
  generateVideo: (params: GenerateVideoParams) => Promise<GeneratedVideo>;
  generateImage: (params: GenerateImageParams) => Promise<GeneratedImage>;
  swapFaceWithImageModel: (params: SwapFaceParams) => Promise<GeneratedImage>;
};

/** Get the active provider module based on AI_PROVIDER env. */
function getProvider(): ProviderModule {
  switch (env.AI_PROVIDER) {
    case "atlascloud":
      return atlascloud;
    case "vertex":
      return vertexai;
    case "openrouter":
    default:
      return openrouter;
  }
}

/** The active provider name (for logging / debugging). */
export const activeProvider = env.AI_PROVIDER;

// ---------------------------------------------------------------------------
// Re-exported functions — delegate to the active provider
// ---------------------------------------------------------------------------

export function listVideoModels(): Promise<VideoModel[]> {
  return getProvider().listVideoModels();
}

export function listImageModels(): Promise<VideoModel[]> {
  return getProvider().listImageModels();
}

export function listSwapModels(): Promise<SwapModelOption[]> {
  return getProvider().listSwapModels();
}

export function generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
  return getProvider().generateVideo(params);
}

export function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  return getProvider().generateImage(params);
}

export function swapFaceWithImageModel(params: SwapFaceParams): Promise<GeneratedImage> {
  return getProvider().swapFaceWithImageModel(params);
}

// ---------------------------------------------------------------------------
// OpenRouter-specific helpers re-exported for backward compatibility
// ---------------------------------------------------------------------------

/**
 * Whether a video model honors an audio `input_references` entry (audio-driven
 * lip-sync). This is OpenRouter-specific knowledge but safe to export globally
 * — non-OpenRouter providers simply won't have models matching the pattern.
 */
export { supportsAudioLipsync } from "./openrouter.js";
