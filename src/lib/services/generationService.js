import { getAdapterForModel } from '@/src/lib/providerRouter.js';
import {
  getModelById,
  getVideoModelById,
  getI2IModelById,
  getI2VModelById,
  getV2VModelById,
  getLipSyncModelById,
  getAudioModelById,
} from '@/packages/studio/src/models.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processGenerationRequest(action, params, keys) {
  let adapter;
  let result;
  const { openrouterKey, aimlapiKey, goapiKey, hfToken, falKey } = keys;

  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      switch (action) {
        case 'generateImage': {
          const modelInfo = getModelById(params.model);
          adapter = getAdapterForModel(modelInfo, 't2i');
          if (adapter === (await import('@/src/lib/providers/openrouter.js')).openRouterAdapter)
            params._apiKey = openrouterKey;
          if (adapter === (await import('@/src/lib/providers/aimlapi.js')).aimlapiAdapter)
            params._apiKey = aimlapiKey;
          if (adapter === (await import('@/src/lib/providers/goapi.js')).goapiAdapter)
            params._apiKey = goapiKey;
          if (adapter === (await import('@/src/lib/providers/huggingface.js')).huggingfaceAdapter)
            params._apiKey = hfToken;
          result = await adapter.generateImage(params);
          break;
        }
        case 'generateI2I': {
          const modelInfo = getI2IModelById(params.model);
          adapter = getAdapterForModel(modelInfo, 'i2i');
          if (!adapter.generateI2I) throw new Error('Adapter does not support I2I');
          params._apiKey = adapter.provider === 'goapi' ? goapiKey : aimlapiKey;
          result = await adapter.generateI2I(params);
          break;
        }
        case 'generateVideo': {
          const modelInfo = getVideoModelById(params.model);
          adapter = getAdapterForModel(modelInfo, 'video');
          params._apiKey = aimlapiKey;
          result = await adapter.generateVideo(params);
          break;
        }
        case 'generateI2V': {
          const modelInfo = getI2VModelById(params.model);
          adapter = getAdapterForModel(modelInfo, 'i2v');
          if (!adapter.generateI2V) throw new Error('Adapter does not support I2V');
          params._apiKey = aimlapiKey;
          result = await adapter.generateI2V(params);
          break;
        }
        case 'generateMarketingStudioAd': {
          adapter = getAdapterForModel({ provider: 'aimlapi' }, 'video');
          params._apiKey = aimlapiKey;
          result = await adapter.generateMarketingStudioAd(params);
          break;
        }
        case 'processV2V': {
          const modelInfo = getV2VModelById(params.model);
          adapter = getAdapterForModel(modelInfo, 'v2v');
          if (!adapter.processV2V) throw new Error('Adapter does not support V2V');
          params._apiKey = aimlapiKey;
          result = await adapter.processV2V(params);
          break;
        }
        case 'processRecast': {
          adapter = getAdapterForModel({ provider: 'aimlapi' }, 'video');
          params._apiKey = aimlapiKey;
          result = await adapter.processRecast(params);
          break;
        }
        case 'processLipSync': {
          const modelInfo = getLipSyncModelById(params.model);
          adapter = getAdapterForModel(modelInfo, 'lipsync');
          if (!adapter.processLipSync) throw new Error('Adapter does not support LipSync');
          params._apiKey = falKey;
          result = await adapter.processLipSync(params);
          break;
        }
        case 'generateAudio': {
          const modelId = params._modelId || params.model;
          const modelInfo = getAudioModelById(modelId);
          adapter = getAdapterForModel(modelInfo, 'audio');
          if (!adapter.generateAudio) throw new Error('Adapter does not support Audio');
          params._apiKey = aimlapiKey;
          result = await adapter.generateAudio(params);
          break;
        }
        case 'runClipping': {
          adapter = getAdapterForModel({ provider: 'aimlapi' }, 'video');
          params._apiKey = aimlapiKey;
          result = await adapter.runClipping(params);
          break;
        }
        case 'runMotionGraphics': {
          adapter = getAdapterForModel({ provider: 'aimlapi' }, 'video');
          params._apiKey = aimlapiKey;
          result = await adapter.runMotionGraphics(params);
          break;
        }
        case 'runMotionGraphicsEdit': {
          adapter = getAdapterForModel({ provider: 'aimlapi' }, 'video');
          params._apiKey = aimlapiKey;
          result = await adapter.runMotionGraphicsEdit(params);
          break;
        }
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // If successful, return result immediately
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`[AI System] Request failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
      
      // Don't retry client-side validation errors
      if (error.message.includes('Adapter does not support') || error.message.includes('Unknown action')) {
        throw error;
      }

      // Exponential backoff
      attempt++;
      if (attempt < maxRetries) {
        await delay(1000 * Math.pow(2, attempt)); // 2s, 4s...
      }
    }
  }

  throw new Error(`AI Request failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}
