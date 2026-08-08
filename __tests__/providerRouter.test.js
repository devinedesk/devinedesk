import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdapterForModel, executeWithFallback } from '../src/lib/providerRouter.js';
import { openRouterAdapter } from '../src/lib/providers/openrouter.js';
import { goapiAdapter } from '../src/lib/providers/goapi.js';
import { aimlapiAdapter } from '../src/lib/providers/aimlapi.js';
import { falaiAdapter } from '../src/lib/providers/falai.js';
import { huggingfaceAdapter } from '../src/lib/providers/huggingface.js';

describe('providerRouter - getAdapterForModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should route openrouter provider correctly', () => {
    expect(getAdapterForModel({ provider: 'openrouter', id: 'gpt-4' })).toBe(openRouterAdapter);
  });

  it('should route midjourney correctly', () => {
    expect(getAdapterForModel({ provider: 'midjourney', id: 'midjourney-v6' })).toBe(goapiAdapter);
    expect(getAdapterForModel({ id: 'midjourney' })).toBe(goapiAdapter);
  });

  it('should route lipsync models to falai', () => {
    expect(getAdapterForModel({ id: 'any-model' }, 'lipsync')).toBe(falaiAdapter);
  });

  it('should route video models to aimlapi', () => {
    expect(getAdapterForModel({ id: 'kling' }, 'video')).toBe(aimlapiAdapter);
    expect(getAdapterForModel({ id: 'runway' }, 'i2v')).toBe(aimlapiAdapter);
  });

  it('should fallback to openrouter when info is missing', () => {
    expect(getAdapterForModel(null)).toBe(openRouterAdapter);
    expect(getAdapterForModel({})).toBe(openRouterAdapter);
  });
});

describe('providerRouter - executeWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first try if primary adapter works', async () => {
    const mockModel = { provider: 'openrouter', id: 'gpt-4' };
    vi.spyOn(openRouterAdapter, 'generateImage').mockResolvedValue('success');

    const result = await executeWithFallback(mockModel, 'test prompt');
    expect(result).toBe('success');
    expect(openRouterAdapter.generateImage).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit (429) then succeed', async () => {
    const mockModel = { provider: 'openrouter', id: 'gpt-4' };
    const rateLimitError = new Error('Rate Limited');
    rateLimitError.status = 429;

    vi.spyOn(openRouterAdapter, 'generateImage')
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce('success after retry');

    const result = await executeWithFallback(mockModel, 'test prompt', {}, 2);
    expect(result).toBe('success after retry');
    expect(openRouterAdapter.generateImage).toHaveBeenCalledTimes(2);
  });

  it('should fallback to alternate provider if primary fails completely', async () => {
    const mockModel = { provider: 'openrouter', id: 'gpt-4' };
    const serverError = new Error('Internal Server Error');
    serverError.status = 500;

    // OpenRouter fails all retries
    vi.spyOn(openRouterAdapter, 'generateImage').mockRejectedValue(serverError);

    // Fallback AIMLAPI succeeds
    vi.spyOn(aimlapiAdapter, 'generateImage').mockResolvedValue('success from fallback');

    const result = await executeWithFallback(mockModel, 'test prompt', {}, 1);
    expect(result).toBe('success from fallback');
    expect(openRouterAdapter.generateImage).toHaveBeenCalled();
    expect(aimlapiAdapter.generateImage).toHaveBeenCalled();
  });
});
