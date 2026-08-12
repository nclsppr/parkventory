import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("public demo API boundary", () => {
  it("refuses a magic-link callback without contacting an API", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { verifyMagicLink } = await import("./client");

    await expect(verifyMagicLink("demo-token")).rejects.toMatchObject({
      message: expect.stringContaining("démo publique"),
      status: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
