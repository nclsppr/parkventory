import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const migrations = await readD1Migrations(new URL("../migrations", import.meta.url).pathname);

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: new URL("../wrangler.jsonc", import.meta.url).pathname },
      miniflare: {
        compatibilityDate: "2026-08-22",
        bindings: {
          APP_ENV: "development",
          APP_SECRET: "worker-test-secret",
          TURNSTILE_SECRET_KEY: "turnstile-test-secret",
          TEST_MIGRATIONS: migrations,
        },
      },
    }),
  ],
  test: {
    include: ["worker/test/**/*.test.ts"],
  },
});
