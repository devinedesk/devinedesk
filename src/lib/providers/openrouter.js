export const openRouterAdapter = {
    getKey: (params) => {
        const key = params?._apiKey;
        if (!key) throw new Error('OpenRouter API Key missing. Please set it in Settings or Environment.');
        return key;
    },
    
    generateImage: async function(params) {
        const key = this.getKey(params);
        const url = 'https://openrouter.ai/api/v1/chat/completions';
        
        // OpenRouter acts like OpenAI, so we wrap the image generation or text generation in its expected format.
        // NOTE: OpenRouter does support multimodal and some image generation models.
        const payload = {
            model: params.model,
            messages: [
                { role: "user", content: params.prompt }
            ],
            temperature: params.temperature || 0.7,
            top_p: params.top_p || 1,
            seed: params.seed
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter Error: ${err}`);
        }

        const data = await response.json();
        
        // Normalize response to Local API format { url: "..." }
        // Depending on if it's text or image, extract appropriately. 
        // For simplicity, we assume an image URL or text content is returned in choices[0].message.content
        const content = data.choices?.[0]?.message?.content;
        
        return {
            url: content // If the model returns markdown with image, or direct URL.
        };
    },

    generateI2I: async function(params) {
        throw new Error('Image-to-Image not natively supported by standard OpenRouter text endpoints yet.');
    },

    generateVideo: async function(params) {
        throw new Error('Video generation not supported by OpenRouter.');
    }
};
