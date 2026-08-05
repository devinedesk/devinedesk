export const huggingfaceAdapter = {
    getKey: (params) => {
        const key = params?._apiKey;
        if (!key) throw new Error('Hugging Face Token missing. Please set it in Settings or Environment.');
        return key;
    },
    
    generateImage: async function(params) {
        const key = this.getKey(params);
        // Fallback to a generic inference endpoint if specific model not mapped
        const endpointId = params.model || 'stabilityai/stable-diffusion-xl-base-1.0';
        const url = `https://api-inference.huggingface.co/models/${endpointId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: params.prompt })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Hugging Face Error: ${err}`);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        return { url: imageUrl };
    },

    generateI2I: async function(params) {
        throw new Error('I2I is highly model-specific on HuggingFace Inference API.');
    },

    generateVideo: async function(params) {
        throw new Error('Video generation is highly model-specific on HuggingFace Inference API.');
    }
};
