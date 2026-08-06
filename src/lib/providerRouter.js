import { openRouterAdapter } from './providers/openrouter.js';
import { aimlapiAdapter } from './providers/aimlapi.js';
import { goapiAdapter } from './providers/goapi.js';
import { huggingfaceAdapter } from './providers/huggingface.js';
import { falaiAdapter } from './providers/falai.js';

/**
 * Resolves the given model information into the appropriate API provider adapter.
 * 
 * Strategy:
 * - Midjourney models -> goapi
 * - LipSync models -> falai
 * - Video & Audio models (Kling, Runway, Suno) -> aimlapi
 * - 3D / Niche open source -> huggingface
 * - Everything else (Text, standard Flux/DALL-E) -> openrouter
 */
export function getAdapterForModel(modelInfo, modelType = 't2i') {
    if (!modelInfo) {
        // Fallback to openrouter if model info is missing
        return openRouterAdapter;
    }

    const providerId = modelInfo.provider?.toLowerCase() || '';
    const modelId = modelInfo.id?.toLowerCase() || '';

    // Explicit provider routing
    if (providerId === 'openrouter') return openRouterAdapter;
    if (providerId === 'aimlapi') return aimlapiAdapter;
    if (providerId === 'goapi') return goapiAdapter;
    if (providerId === 'huggingface') return huggingfaceAdapter;
    if (providerId === 'falai') return falaiAdapter;

    // Midjourney -> GoAPI
    if (providerId === 'midjourney' || modelId.includes('midjourney')) {
        return goapiAdapter;
    }

    // LipSync -> Fal.ai
    if (modelType === 'lipsync') {
        return falaiAdapter;
    }

    // Video & Audio models -> AIMLAPI
    if (modelType === 'video' || modelType === 'i2v' || modelType === 'v2v' || modelType === 'audio') {
        return aimlapiAdapter;
    }

    // 3D Models / Specific Niche -> HuggingFace
    if (modelId.includes('tripo3d') || modelId.includes('meshy') || modelType === '3d') {
        return huggingfaceAdapter;
    }

    // Default to OpenRouter for all Text and standard Image models
    return openRouterAdapter;
}
