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

describe("production error boundary", () => {
  it.each([
    [403, "Action interdite.", "Action interdite."],
    [409, "La place vient de changer.", "La place vient de changer."],
    [429, "Détail serveur ignoré.", "Réessayez dans 12 secondes."],
    [500, "Trace interne à masquer.", "Le service rencontre un problème."],
  ])("maps HTTP %s to an actionable safe message", async (status, detail, expected) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ status, detail }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
          ...(status === 429 ? { "Retry-After": "12" } : {}),
        },
      },
    )));
    const { loadDashboard } = await import("./client");

    await expect(loadDashboard()).rejects.toMatchObject({
      message: expect.stringContaining(expected),
      status,
      ...(status === 429 ? { retryAfterSeconds: 12 } : {}),
    });
  });

  it("uses the caller idempotency key for a reservation retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ accepted: true, message: "Réservation confirmée." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { reserveSpot } = await import("./client");

    await reserveSpot(
      "f9c7f44a-63da-4d94-9172-8f92444415ad",
      "stable-attempt-key",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/availability/f9c7f44a-63da-4d94-9172-8f92444415ad/reservations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "stable-attempt-key" }),
      }),
    );
  });
});
