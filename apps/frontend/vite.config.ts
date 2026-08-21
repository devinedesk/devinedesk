import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  // Generate hidden source maps (uploaded to Sentry, not served to users).
  build: {
    sourcemap: "hidden",
  },
  plugins: [
    react(),
    tailwindcss(),
    // Sentry Vite plugin must be after all other plugins.
    sentryVitePlugin({
      org: "devinedesk",
      project: "javascript-react",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Only upload source maps when an auth token is present (CI/CD).
      // Local builds without a token skip the upload gracefully.
      ...(process.env.SENTRY_AUTH_TOKEN
        ? { sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] } }
        : { disable: true }),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
