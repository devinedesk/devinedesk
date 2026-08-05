export const aimlapiAdapter = {
    getKey: (params) => {
        const key = params?._apiKey;
        if (!key) throw new Error('AIMLAPI Key missing. Please set it in Settings or Environment.');
        return key;
    },

    // Example Polling implementation for AIMLAPI asynchronous endpoints
    pollForResult: async function(requestId, key, maxAttempts = 60, interval = 2000) {
        // AI/ML API uses different polling endpoints depending on the exact model (e.g. video vs image)
        // This is a generic representation.
        const pollUrl = `https://api.aimlapi.com/v2/generate/status/${requestId}`;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            
            const response = await fetch(pollUrl, {
                headers: { 'Authorization': `Bearer ${key}` }
            });

            if (!response.ok) continue; // retry on 500s or temporary errors

            const data = await response.json();
            const status = data.status?.toLowerCase();

            if (status === 'completed' || status === 'succeeded') {
                return data;
            }
            if (status === 'failed' || status === 'error') {
                throw new Error(`AIMLAPI Generation failed: ${data.error || 'Unknown error'}`);
            }
        }
        throw new Error('AIMLAPI Generation timed out.');
    },
    
    generateVideo: async function(params) {
        const key = this.getKey(params);
        const url = 'https://api.aimlapi.com/v2/generate/video';

        const payload = {
            model: params.model,
            prompt: params.prompt,
            image_url: params.image_url,
            aspect_ratio: params.aspect_ratio || "16:9",
            duration: params.duration,
            quality: params.quality,
            mode: params.mode
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
            throw new Error(`AIMLAPI Error: ${err}`);
        }

        const data = await response.json();
        
        // Polling logic
        const requestId = data.id || data.request_id;
        if (params.onRequestId && requestId) params.onRequestId(requestId);

        if (requestId) {
            const result = await this.pollForResult(requestId, key, 900, 2000);
            return { url: result.video_url || result.url || result.output?.url };
        }

        return { url: data.video_url || data.url };
    },

    generateI2V: async function(params) {
        // Re-use generateVideo as AIMLAPI combines text-to-video and image-to-video usually
        return this.generateVideo(params);
    },

    generateAudio: async function(params) {
        const key = this.getKey(params);
        const url = 'https://api.aimlapi.com/v2/generate/audio/suno-ai/suno-v3_5'; // Default suno endpoint

        const payload = {
            prompt: params.prompt,
            make_instrumental: params.make_instrumental || false,
            tags: params.tags || ''
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
            throw new Error(`AIMLAPI Audio Error: ${err}`);
        }

        const data = await response.json();
        
        // Suno payload includes array of clips
        return { 
            url: data.clips?.[0]?.audio_url || data.audio_url || data.url
        };
    },

    processLipSync: async function(params) {
        throw new Error('Specific LipSync model not supported on AIMLAPI yet.');
    },

    generateMarketingStudioAd: async function(params) {
        // Route marketing ads to Kling Video as a fallback
        return this.generateVideo({
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio,
            model: 'kling-video/v1.2/standard/text-to-video'
        });
    },

    processRecast: async function(params) {
        // Route recast to Kling Image-to-Video
        return this.generateVideo({
            prompt: params.prompt,
            image_url: params.image_url,
            aspect_ratio: params.aspect_ratio,
            model: 'kling-video/v1.2/standard/image-to-video'
        });
    },

    runClipping: async function(params) {
        throw new Error('AI Clipping is not supported by AIMLAPI.');
    },

    runMotionGraphics: async function(params) {
        return this.generateVideo({
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio,
            model: 'luma/ray-v2' // Good for motion graphics
        });
    },

    runMotionGraphicsEdit: async function(params) {
        return this.generateVideo({
            prompt: params.edit_prompt,
            aspect_ratio: params.aspect_ratio,
            model: 'luma/ray-v2'
        });
    }
};
