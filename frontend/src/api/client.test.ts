import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
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

  it("conserve uniquement une référence d’incident 500 au format sûr", async () => {
    const incidentId = "01234567-89ab-4def-8123-456789abcdef";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({
        status: 500,
        detail: `Le service rencontre un problème. Référence : ${incidentId}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )));
    const { loadDashboard } = await import("./client");

    await expect(loadDashboard()).rejects.toMatchObject({
      message: expect.stringContaining(incidentId),
      status: 500,
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

  it("serializes opaque admin cursors and search filters without empty values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ items: [], page: { nextCursor: null } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { loadAdminTenants } = await import("./client");

    await loadAdminTenants({ cursor: "opaque_-cursor", q: "Victor Buck & Co" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/tenants?limit=25&cursor=opaque_-cursor&q=Victor+Buck+%26+Co",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("encodes a tenant identifier as one path segment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ tenant: {}, stats: {}, recentActivity: [], recentMembers: [], recentSpots: [], links: {} }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { loadAdminTenant } = await import("./client");

    await loadAdminTenant("org/with slash");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/tenants/org%2Fwith%20slash",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sends all activity filters using the backend camelCase contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ items: [], page: { nextCursor: null } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { loadAdminActivity } = await import("./client");

    await loadAdminActivity({
      tenantId: "org_1",
      userId: "usr_1",
      type: "ACCESS_DENIED",
      severity: "ERROR",
      errorCode: "TENANT_BOUNDARY_MISMATCH",
      reference: "incident_1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/activity?limit=50&tenantId=org_1&userId=usr_1&type=ACCESS_DENIED&severity=ERROR&errorCode=TENANT_BOUNDARY_MISMATCH&reference=incident_1",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("loads one integrity check with its opaque pagination cursor", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ check: "active_offer_overlap", items: [], page: { nextCursor: null } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { loadAdminDiagnosticsIntegrity } = await import("./client");

    await loadAdminDiagnosticsIntegrity({
      check: "active_offer_overlap",
      cursor: "opaque_integrity_cursor",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/diagnostics/integrity?check=active_offer_overlap&limit=25&cursor=opaque_integrity_cursor",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
