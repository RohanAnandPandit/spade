import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.VITE_PROXY_TARGET ?? "http://127.0.0.1:5000",
    },
  },
  build: {
    // SPADE keeps a broad chart catalogue; heavy chart modules are lazy-loaded.
    chunkSizeWarningLimit: 2_000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
