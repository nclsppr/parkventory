import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiProxyTarget = env.VITE_DEV_API_PROXY || "http://127.0.0.1:8787";

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    server: {
      proxy: {
        "/api": apiProxyTarget,
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
