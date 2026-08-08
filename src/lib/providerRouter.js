import { openRouterAdapter } from './providers/openrouter.js';
import { aimlapiAdapter } from './providers/aimlapi.js';
import { goapiAdapter } from './providers/goapi.js';
import { huggingfaceAdapter } from './providers/huggingface.js';
import { falaiAdapter } from './providers/falai.js';
import { logError, logInfo } from './logger.js'; // Assuming logger exists

/**
 * Resolves the given model information into the primary API provider adapter.
 */
export function getAdapterForModel(modelInfo, modelType = 't2i') {
  if (!modelInfo) return openRouterAdapter;

  const providerId = modelInfo.provider?.toLowerCase() || '';
  const modelId = modelInfo.id?.toLowerCase() || '';

  if (providerId === 'openrouter') return openRouterAdapter;
  if (providerId === 'aimlapi') return aimlapiAdapter;
  if (providerId === 'goapi') return goapiAdapter;
  if (providerId === 'huggingface') return huggingfaceAdapter;
  if (providerId === 'falai') return falaiAdapter;

  if (providerId === 'midjourney' || modelId.includes('midjourney')) return goapiAdapter;
  if (modelType === 'lipsync') return falaiAdapter;
  if (['video', 'i2v', 'v2v', 'audio'].includes(modelType)) return aimlapiAdapter;
  if (modelId.includes('tripo3d') || modelId.includes('meshy') || modelType === '3d')
    return huggingfaceAdapter;

  return openRouterAdapter;
}

/**
 * Gets a list of fallback adapters in case the primary adapter fails.
 * E.g., if OpenRouter fails, try AIMLAPI or HuggingFace.
 */
function getFallbackAdapters(primaryAdapter) {
  if (primaryAdapter === openRouterAdapter) return [aimlapiAdapter, huggingfaceAdapter];
  if (primaryAdapter === aimlapiAdapter) return [openRouterAdapter, huggingfaceAdapter];
  if (primaryAdapter === huggingfaceAdapter) return [aimlapiAdapter, openRouterAdapter];
  return [openRouterAdapter]; // Default fallback for everything else
}

/**
 * Executes an AI generation request with automatic retries and provider fallback.
 */
export async function executeWithFallback(modelInfo, prompt, options = {}, maxRetries = 2) {
  const primaryAdapter = getAdapterForModel(modelInfo, options.type);
  const fallbacks = getFallbackAdapters(primaryAdapter);
  const adaptersToTry = [primaryAdapter, ...fallbacks];

  let lastError = null;

  for (const adapter of adaptersToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Determine the correct generation method
        let methodName = 'generateImage';
        if (['video', 'i2v', 'v2v'].includes(options.type)) methodName = 'generateVideo';
        else if (options.type === 'lipsync') methodName = 'generateVideo'; // Fallback for lipsync

        if (typeof adapter[methodName] !== 'function') {
          throw new Error(`Method ${methodName} not supported by this provider.`);
        }

        const result = await adapter[methodName]({ ...options, prompt, model: modelInfo?.id });
        if (result) {
          return result;
        }
      } catch (err) {
        lastError = err;
        if (err?.status === 429 || err?.status >= 500) {
          // Retryable error (rate limit or server error)
          const backoffMs = attempt * 1000 + Math.random() * 500;
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        } else {
          // Non-retryable error (e.g. 400 Bad Request, auth failure)
          break;
        }
      }
    }
    // If we reach here, all retries for this adapter failed. Moving to fallback adapter.
    if (logInfo) {
      logInfo(`Primary adapter failed, switching to fallback.`, {
        previousError: lastError?.message,
      });
    }
  }

  throw new Error(
    `All providers and retries failed for model ${modelInfo?.id}. Last Error: ${lastError?.message}`
  );
}
