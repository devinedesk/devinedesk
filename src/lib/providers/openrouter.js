import { withRetries } from '../ai-utils.js';

export const openRouterAdapter = {
  getKey: (params) => {
    const key = params?._apiKey;
    if (!key)
      throw new Error('OpenRouter API Key missing. Please set it in Settings or Environment.');
    return key;
  },

  generateText: async function (params) {
    const key = this.getKey(params);
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    // If messages are passed directly (like in agent chat), use them.
    // Otherwise, wrap the prompt in a user message.
    const messages = params.messages || [{ role: 'user', content: params.prompt }];

    const payload = {
      model: params.model || 'meta-llama/llama-3.1-8b-instruct:free',
      messages,
      temperature: params.temperature || 0.7,
      top_p: params.top_p || 1,
      seed: params.seed,
    };

    const executeFetch = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter Error (${response.status}): ${err}`);
      }

      return await response.json();
    };

    // Apply Phase 16: Retries with exponential backoff
    const data = await withRetries(executeFetch, 3, 1500);

    const content = data.choices?.[0]?.message?.content;

    return {
      text: content,
      url: content, // fallback for legacy logic
    };
  },

  generateImage: async function (params) {
    throw new Error('Image generation not supported by OpenRouter.');
  },

  generateI2I: async function (params) {
    throw new Error(
      'Image-to-Image not natively supported by standard OpenRouter text endpoints yet.'
    );
  },

  generateVideo: async function (params) {
    throw new Error('Video generation not supported by OpenRouter.');
  },
};
