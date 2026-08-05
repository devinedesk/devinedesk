import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        proxy: {
            '/api': {
                target: process.env.BACKEND_API_URL || 'https://api.Local API.ai',
                changeOrigin: true,
                secure: false
            }
        }
    }
});
