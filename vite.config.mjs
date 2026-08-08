import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      'next/navigation': path.resolve(__dirname, 'src/next-shim.jsx'),
      'next/image': path.resolve(__dirname, 'src/next-shim.jsx'),
      'next/dynamic': path.resolve(__dirname, 'src/next-shim.jsx'),
      'design-agent': path.resolve(
        __dirname,
        'packages/Open-AI-Design-Agent/packages/design-agent/src'
      ),
      'workflow-builder': path.resolve(
        __dirname,
        'packages/Vibe-Workflow/packages/workflow-builder/src'
      ),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?|components\/.*\.jsx?/,
    exclude: [],
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.BACKEND_API_URL || 'https://api.Local API.ai',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
