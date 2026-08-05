import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getLipSyncModelById } from './models.js';
import { getAdapterForModel } from './providerRouter.js';

export class ApiClient {
    constructor() {
        this.baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000');
    }

    async generateImage(params) {
        const modelInfo = getModelById(params.model);
        const adapter = getAdapterForModel(modelInfo, 't2i');
        console.debug(`[MultiProvider] Routing image request to adapter for model: ${params.model}`);
        return adapter.generateImage(params);
    }

    async generateVideo(params) {
        const modelInfo = getVideoModelById(params.model);
        const adapter = getAdapterForModel(modelInfo, 'video');
        console.debug(`[MultiProvider] Routing video request to adapter for model: ${params.model}`);
        return adapter.generateVideo(params);
    }

    async generateI2I(params) {
        const modelInfo = getI2IModelById(params.model);
        const adapter = getAdapterForModel(modelInfo, 'i2i');
        console.debug(`[MultiProvider] Routing i2i request to adapter for model: ${params.model}`);
        if (!adapter.generateI2I) throw new Error("Adapter does not support I2I");
        return adapter.generateI2I(params);
    }

    async generateI2V(params) {
        const modelInfo = getI2VModelById(params.model);
        const adapter = getAdapterForModel(modelInfo, 'i2v');
        console.debug(`[MultiProvider] Routing i2v request to adapter for model: ${params.model}`);
        if (!adapter.generateI2V) throw new Error("Adapter does not support I2V");
        return adapter.generateI2V(params);
    }

    async generateAudio(params) {
        // Just route directly to aimlapi for audio (like suno)
        const adapter = getAdapterForModel(null, 'audio');
        console.debug(`[MultiProvider] Routing audio request to adapter for model: ${params.model}`);
        if (!adapter.generateAudio) throw new Error("Adapter does not support Audio");
        return adapter.generateAudio(params);
    }

    async uploadFile(file) {
        const cloudName = window.__CLOUDINARY_CLOUD_NAME__ || localStorage.getItem('cloudinary_cloud_name');
        const uploadPreset = window.__CLOUDINARY_UPLOAD_PRESET__ || localStorage.getItem('cloudinary_upload_preset');
        
        if (!cloudName || !uploadPreset) {
            throw new Error('Cloudinary credentials missing. Please set Cloud Name and Upload Preset in Settings.');
        }

        const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`File upload failed`);
        const data = await response.json();
        return data.secure_url || data.url;
    }

    async processV2V(params) {
        const modelInfo = getV2VModelById(params.model);
        const adapter = getAdapterForModel(modelInfo, 'v2v');
        console.debug(`[MultiProvider] Routing v2v request to adapter for model: ${params.model}`);
        if (!adapter.processV2V) throw new Error("Adapter does not support V2V");
        return adapter.processV2V(params);
    }

    async processLipSync(params) {
        const modelInfo = getLipSyncModelById(params.model);
        const adapter = getAdapterForModel(modelInfo, 'lipsync');
        console.debug(`[MultiProvider] Routing lipsync request to adapter for model: ${params.model}`);
        if (!adapter.processLipSync) throw new Error("Adapter does not support LipSync");
        return adapter.processLipSync(params);
    }

    getDimensionsFromAR(ar) {
        switch (ar) {
            case '1:1': return [1024, 1024];
            case '16:9': return [1280, 720]; 
            case '9:16': return [720, 1280];
            case '4:3': return [1152, 864];
            case '3:2': return [1216, 832];
            case '21:9': return [1536, 640];
            default: return [1024, 1024];
        }
    }
}

export const api = new ApiClient();
