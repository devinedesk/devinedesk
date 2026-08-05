export const falaiAdapter = {
    getKey: (params) => {
        const key = params?._apiKey;
        if (!key) throw new Error('Fal.ai API Key missing. Please set it in Settings or Environment.');
        return key;
    },

    pollForResult: async function(requestId, key, maxAttempts = 60, interval = 2000) {
        // Fal queue status endpoint: GET https://queue.fal.run/{requestId}/status
        const pollUrl = `https://queue.fal.run/fal-ai/latentsync/requests/${requestId}/status`;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            
            const response = await fetch(pollUrl, {
                headers: { 'Authorization': `Key ${key}` }
            });

            if (!response.ok) continue;

            const data = await response.json();
            const status = data.status?.toLowerCase();

            if (status === 'completed' || status === 'succeeded' || status === 'OK') {
                // Fetch the result
                const resResponse = await fetch(`https://queue.fal.run/fal-ai/latentsync/requests/${requestId}`, {
                    headers: { 'Authorization': `Key ${key}` }
                });
                return await resResponse.json();
            }
            if (status === 'failed' || status === 'error') {
                throw new Error(`Fal.ai Generation failed: ${data.error || 'Unknown error'}`);
            }
        }
        throw new Error('Fal.ai Generation timed out.');
    },

    processLipSync: async function(params) {
        const key = this.getKey(params);
        // Fal.ai uses fal-ai/latentsync
        const url = 'https://queue.fal.run/fal-ai/latentsync';

        // Fal LatentSync expects video_url and audio_url
        const payload = {
            video_url: params.video_url || params.image_url,
            audio_url: params.audio_url,
            // mapping sync options
            sync_mode: params.mode || 'standard'
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${key}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Fal.ai Error: ${err}`);
        }

        const data = await response.json();
        const requestId = data.request_id;
        
        if (params.onRequestId && requestId) params.onRequestId(requestId);

        if (requestId) {
            const result = await this.pollForResult(requestId, key, 300, 2000);
            return { url: result.video?.url || result.url };
        }

        return { url: data.video?.url || data.url };
    }
};
