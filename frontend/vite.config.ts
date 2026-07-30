import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    server: {
      proxy: {
        "/api": "http://127.0.0.1:8080",
        "/q": "http://127.0.0.1:8080",
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
