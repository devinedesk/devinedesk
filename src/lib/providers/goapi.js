export const goapiAdapter = {
    getKey: () => {
        const key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOAPI_KEY) 
            || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOAPI_KEY)
            || window.__GOAPI_KEY__ 
            || localStorage.getItem('goapi_key');
        if (!key) throw new Error('GoAPI Key missing. Please set it in Settings.');
        return key;
    },

    pollForResult: async function(taskId, key, maxAttempts = 60, interval = 2000) {
        const pollUrl = `https://api.midjourneyapi.xyz/mj/v2/fetch`;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            
            const response = await fetch(pollUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
                body: JSON.stringify({ task_id: taskId })
            });

            if (!response.ok) continue;

            const data = await response.json();
            const status = data.status?.toLowerCase();

            if (status === 'finished' || status === 'completed') {
                return data;
            }
            if (status === 'failed' || status === 'error') {
                throw new Error(`GoAPI Generation failed: ${data.error || 'Unknown error'}`);
            }
        }
        throw new Error('GoAPI Generation timed out.');
    },
    
    generateImage: async function(params) {
        const key = this.getKey();
        const url = 'https://api.midjourneyapi.xyz/mj/v2/imagine';

        let fullPrompt = params.prompt;
        if (params.aspect_ratio) fullPrompt += ` --ar ${params.aspect_ratio}`;
        if (params.quality) fullPrompt += ` --q ${params.quality}`;
        if (params.seed) fullPrompt += ` --seed ${params.seed}`;

        const payload = {
            prompt: fullPrompt,
            process_mode: "relax" // map params to goapi equivalents
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': key
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`GoAPI Error: ${err}`);
        }

        const data = await response.json();
        const taskId = data.task_id;
        
        if (params.onRequestId && taskId) params.onRequestId(taskId);

        if (taskId) {
            const result = await this.pollForResult(taskId, key, 900, 3000);
            return { url: result.task_result?.image_url };
        }

        return { url: data.image_url };
    }
};
