/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { SYSTEM_ORGANIZATION_DOMAIN, SYSTEM_ORGANIZATION_ID } from "../src/admin";
import { displayName, organizationName } from "../src/domain";
import { isGodmodeEmail, sha256 } from "../src/security";
import type { Bindings } from "../src/types";

type TestEnv = Omit<Env, "APP_ENV"> & {
  APP_ENV: "development";
  TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

const testEnv = env as unknown as TestEnv;
const godmodeEmail = "godmode@example.test";
const godmodeDigest = "3fa6de1b3659ea48fcefef2a0d499ca28b419298022c40c7b4862bf3c00671e6";

beforeEach(async () => {
  await applyD1Migrations(testEnv.DB, testEnv.TEST_MIGRATIONS);
  await testEnv.DB.batch([
    testEnv.DB.prepare("DELETE FROM activity_event"),
    testEnv.DB.prepare("DELETE FROM reservation"),
    testEnv.DB.prepare("DELETE FROM availability_offer"),
    testEnv.DB.prepare("DELETE FROM parking_spot"),
    testEnv.DB.prepare("DELETE FROM app_session"),
    testEnv.DB.prepare("DELETE FROM magic_link_request"),
    testEnv.DB.prepare("DELETE FROM membership"),
    testEnv.DB.prepare("DELETE FROM user_account"),
    testEnv.DB.prepare("DELETE FROM organization WHERE kind = 'TENANT'"),
  ]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function seedSession({
  domain,
  email,
  role = "MEMBER",
  system = false,
}: {
  domain: string;
  email: string;
  role?: "MEMBER" | "ADMIN";
  system?: boolean;
}) {
  const now = Math.floor(Date.now() / 1000);
  const orgId = system ? SYSTEM_ORGANIZATION_ID : `org-${domain}`;
  const userId = `usr-${crypto.randomUUID()}`;
  const membershipId = `mem-${crypto.randomUUID()}`;
  const linkId = `link-${crypto.randomUUID()}`;
  const sessionId = `session-${crypto.randomUUID()}`;
  const sessionToken = `token-${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const statements = [];
  if (!system) {
    statements.push(testEnv.DB.prepare(`
      INSERT OR IGNORE INTO organization (id, normalized_domain, display_name, created_at)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(orgId, domain, organizationName(domain), now));
  }
  statements.push(
    testEnv.DB.prepare(`
      INSERT INTO user_account (id, normalized_email, display_name, created_at)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(userId, email, displayName(email), now),
    testEnv.DB.prepare(`
      INSERT INTO membership (id, organization_id, user_id, role, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(membershipId, orgId, userId, role, now),
    testEnv.DB.prepare(`
      INSERT INTO magic_link_request (
        id, token_hash, normalized_email, normalized_domain, requested_ip_hash,
        expires_at, consumed_at, created_at
      ) VALUES (?1, ?2, ?3, ?4, 'test-ip-hash', ?5, ?6, ?6)
    `).bind(linkId, await sha256(`link-${sessionToken}`), email, domain, now + 900, now),
    testEnv.DB.prepare(`
      INSERT INTO app_session (
        id, token_hash, magic_link_request_id, membership_id, expires_at, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `).bind(sessionId, await sha256(sessionToken), linkId, membershipId, now + 3600, now),
  );
  await testEnv.DB.batch(statements);
  return { orgId, userId, membershipId, sessionId, token: sessionToken };
}

async function verifyGodmodeMagicLink() {
  const now = Math.floor(Date.now() / 1000);
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
  await testEnv.DB.prepare(`
    INSERT INTO magic_link_request (
      id, token_hash, normalized_email, normalized_domain, requested_ip_hash,
      expires_at, created_at
    ) VALUES (?1, ?2, ?3, ?4, 'test-ip-hash', ?5, ?6)
  `).bind(
    crypto.randomUUID(),
    await sha256(token),
    godmodeEmail,
    SYSTEM_ORGANIZATION_DOMAIN,
    now + 900,
    now,
  ).run();

  const response = await SELF.fetch("https://parkventory.test/api/v1/auth/verify", {
    method: "POST",
    headers: {
      Origin: "https://parkventory.test",
      "Sec-Fetch-Site": "same-origin",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  const body = await response.json<{ godmode: boolean; role: string }>();
  const cookie = response.headers.get("Set-Cookie")?.split(";")[0] ?? "";
  return { response, body, cookie };
}

function sessionHeaders(token: string) {
  return { Cookie: `parkventory_session=${token}` };
}

function bindingsWithDigest(digest: string | undefined): Bindings {
  return {
    DB: testEnv.DB,
    ASSETS: testEnv.ASSETS,
    APP_ENV: "development",
    APP_SECRET: "worker-test-secret",
    TURNSTILE_SECRET_KEY: "turnstile-test-secret",
    GODMODE_ADMIN_EMAIL_SHA256: digest ?? "",
    EMAIL_FROM: "Parkventory <noreply@parkventory.com>",
    PUBLIC_ORIGIN: "https://parkventory.com",
  };
}

function deferredExecutionContext() {
  const pending: Promise<unknown>[] = [];
  const executionCtx = {
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {},
  } as unknown as ExecutionContext;
  return {
    executionCtx,
    drain: () => Promise.all(pending),
  };
}

describe("godmode Parkventory", () => {
  it("ne transforme pas une tentative opérateur non autorisée en onboarding tenant", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));

    const response = await app.request(
      "https://parkventory.test/api/v1/auth/requests",
      {
        method: "POST",
        headers: {
          Origin: "https://parkventory.test",
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "member@unauthorized.test",
          turnstileToken: "turnstile-test-token",
          purpose: "admin",
        }),
      },
      bindingsWithDigest(godmodeDigest),
    );

    expect(response.status).toBe(202);
    const request = await testEnv.DB.prepare(`
      SELECT id FROM magic_link_request WHERE normalized_email = ?1
    `).bind("member@unauthorized.test").first();
    expect(request).toBeNull();
  });

  it("ne révèle pas l’identité opérateur lorsque l’envoi n’est pas configuré", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));

    const deferred = deferredExecutionContext();
    const response = await app.request(
      "https://parkventory.test/api/v1/auth/requests",
      {
        method: "POST",
        headers: {
          Origin: "https://parkventory.test",
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: godmodeEmail,
          turnstileToken: "turnstile-test-token",
          purpose: "admin",
        }),
      },
      bindingsWithDigest(godmodeDigest),
      deferred.executionCtx,
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, message: expect.any(String) });
    await deferred.drain();
    const request = await testEnv.DB.prepare(`
      SELECT id FROM magic_link_request WHERE normalized_email = ?1
    `).bind(godmodeEmail).first();
    expect(request).toBeNull();
  });

  it("émet une demande SYSTEM uniquement pour l’identité opérateur exacte", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    const send = vi.fn().mockResolvedValue(undefined);

    const deferred = deferredExecutionContext();
    const response = await app.request(
      "https://parkventory.test/api/v1/auth/requests",
      {
        method: "POST",
        headers: {
          Origin: "https://parkventory.test",
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: godmodeEmail,
          turnstileToken: "turnstile-test-token",
          purpose: "admin",
        }),
      },
      {
        ...bindingsWithDigest(godmodeDigest),
        EMAIL: { send } as unknown as Env["EMAIL"],
      },
      deferred.executionCtx,
    );

    expect(response.status).toBe(202);
    await deferred.drain();
    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0]?.[0] as { html?: string; text?: string } | undefined;
    expect(message?.html).toContain("/auth/callback#token=");
    expect(message?.text).toContain("/auth/callback#token=");
    expect(message?.html).not.toContain("/auth/callback?token=");
    const request = await testEnv.DB.prepare(`
      SELECT normalized_domain FROM magic_link_request WHERE normalized_email = ?1
    `).bind(godmodeEmail).first<{ normalized_domain: string }>();
    expect(request?.normalized_domain).toBe(SYSTEM_ORGANIZATION_DOMAIN);
  });

  it("garde une réponse admin générique même si D1 échoue hors du chemin de réponse", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const deferred = deferredExecutionContext();
    const send = vi.fn().mockResolvedValue(undefined);
    const failingDb = {
      prepare: vi.fn(() => {
        throw new Error("synthetic D1 outage");
      }),
    } as unknown as D1Database;

    const response = await app.request(
      "https://parkventory.test/api/v1/auth/requests",
      {
        method: "POST",
        headers: {
          Origin: "https://parkventory.test",
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: godmodeEmail,
          turnstileToken: "turnstile-test-token",
          purpose: "admin",
        }),
      },
      {
        ...bindingsWithDigest(godmodeDigest),
        DB: failingDb,
        EMAIL: { send } as unknown as Env["EMAIL"],
      },
      deferred.executionCtx,
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, message: expect.any(String) });
    await expect(deferred.drain()).resolves.toBeDefined();
    expect(send).not.toHaveBeenCalled();
  });

  it("applique atomiquement le quota de magic links sous rafale concurrente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ))));
    const send = vi.fn().mockResolvedValue(undefined);
    const request = () => app.request(
      "https://parkventory.test/api/v1/auth/requests",
      {
        method: "POST",
        headers: {
          Origin: "https://parkventory.test",
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "member@rate-limit.test",
          turnstileToken: "turnstile-test-token",
          purpose: "tenant",
        }),
      },
      {
        ...bindingsWithDigest(godmodeDigest),
        EMAIL: { send } as unknown as Env["EMAIL"],
      },
    );

    const responses = await Promise.all(Array.from({ length: 5 }, request));
    expect(responses.map((response) => response.status).sort()).toEqual([202, 202, 202, 429, 429]);
    expect(send).toHaveBeenCalledTimes(3);
    const stored = await testEnv.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM magic_link_request
      WHERE normalized_email = 'member@rate-limit.test'
    `).first<{ count: number }>();
    expect(stored?.count).toBe(3);
  });

  it("refuse le godmode si le digest secret est absent ou ne correspond pas", async () => {
    const admin = await seedSession({
      domain: SYSTEM_ORGANIZATION_DOMAIN,
      email: godmodeEmail,
      role: "ADMIN",
      system: true,
    });

    for (const digest of [undefined, "digest-malforme", "0".repeat(64)]) {
      const response = await app.request(
        "https://parkventory.test/api/v1/admin/overview",
        { headers: sessionHeaders(admin.token) },
        bindingsWithDigest(digest),
      );
      expect(response.status).toBe(403);
    }

    expect(await isGodmodeEmail(" GODMODE@EXAMPLE.TEST ", godmodeDigest)).toBe(true);
    expect(await isGodmodeEmail("god.mode@example.test", godmodeDigest)).toBe(false);
    expect(await isGodmodeEmail("godmode+alt@example.test", godmodeDigest)).toBe(false);
    expect(await isGodmodeEmail(godmodeEmail, "digest-malforme")).toBe(false);
  });

  it.each(["god.mode@example.test", "godmode+alt@example.test"])(
    "refuse l’alias non exact %s avec le digest valide",
    async (email) => {
      const alias = await seedSession({
        domain: SYSTEM_ORGANIZATION_DOMAIN,
        email,
        role: "ADMIN",
        system: true,
      });
      const response = await SELF.fetch("https://parkventory.test/api/v1/admin/overview", {
        headers: sessionHeaders(alias.token),
      });
      expect(response.status).toBe(403);
    },
  );

  it("impose les invariants SYSTEM au niveau du schéma", async () => {
    const now = Math.floor(Date.now() / 1000);
    const userId = `usr-${crypto.randomUUID()}`;
    await testEnv.DB.prepare(`
      INSERT INTO user_account (id, normalized_email, display_name, created_at)
      VALUES (?1, 'schema@example.test', 'Schema', ?2)
    `).bind(userId, now).run();

    await expect(testEnv.DB.prepare(`
      INSERT INTO membership (id, organization_id, user_id, role, created_at)
      VALUES (?1, ?2, ?3, 'MEMBER', ?4)
    `).bind(crypto.randomUUID(), SYSTEM_ORGANIZATION_ID, userId, now).run()).rejects.toThrow();
    await expect(testEnv.DB.prepare(`
      UPDATE organization SET kind = 'TENANT' WHERE id = ?1
    `).bind(SYSTEM_ORGANIZATION_ID).run()).rejects.toThrow();
    await expect(testEnv.DB.prepare(`
      DELETE FROM organization WHERE id = ?1
    `).bind(SYSTEM_ORGANIZATION_ID).run()).rejects.toThrow();

    const systemOrganizations = await testEnv.DB.prepare(`
      SELECT COUNT(*) AS count FROM organization WHERE kind = 'SYSTEM'
    `).first<{ count: number }>();
    expect(systemOrganizations?.count).toBe(1);
  });

  it("refuse un ADMIN de tenant et interdit les routes métier au compte SYSTEM", async () => {
    const tenantAdmin = await seedSession({
      domain: "tenant-admin.test",
      email: "admin@tenant-admin.test",
      role: "ADMIN",
    });
    const tenantAdminResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/overview", {
      headers: sessionHeaders(tenantAdmin.token),
    });
    expect(tenantAdminResponse.status).toBe(403);
    const repeatedTenantAdminResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/overview", {
      headers: sessionHeaders(tenantAdmin.token),
    });
    expect(repeatedTenantAdminResponse.status).toBe(403);
    const variedTenantAdminResponse = await SELF.fetch(
      `https://parkventory.test/api/v1/admin/${crypto.randomUUID()}?token=must-not-be-recorded`,
      { headers: sessionHeaders(tenantAdmin.token) },
    );
    expect(variedTenantAdminResponse.status).toBe(403);
    const deniedEvent = await testEnv.DB.prepare(`
      SELECT event_type, outcome, severity, organization_id, user_id, membership_id, error_code
      FROM activity_event
      WHERE event_type = 'GODMODE_ACCESS_DENIED'
      ORDER BY occurred_at DESC, id DESC
      LIMIT 1
    `).first<Record<string, unknown>>();
    expect(deniedEvent).toMatchObject({
      event_type: "GODMODE_ACCESS_DENIED",
      outcome: "DENIED",
      severity: "WARNING",
      organization_id: tenantAdmin.orgId,
      user_id: tenantAdmin.userId,
      membership_id: tenantAdmin.membershipId,
      error_code: "GODMODE_FORBIDDEN",
    });
    const deniedCount = await testEnv.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM activity_event
      WHERE event_type = 'GODMODE_ACCESS_DENIED'
        AND membership_id = ?1
        AND route = '/api/v1/admin/*'
    `).bind(tenantAdmin.membershipId).first<{ count: number }>();
    expect(deniedCount?.count).toBe(1);

    const godmode = await verifyGodmodeMagicLink();
    expect(godmode.response.status).toBe(200);
    expect(godmode.body).toMatchObject({ godmode: true, role: "ADMIN" });
    for (const [path, method] of [
      ["/api/v1/dashboard", "GET"],
      ["/api/v1/spots", "POST"],
      ["/api/v1/shares", "POST"],
      ["/api/v1/availability/offer-id/reservations", "POST"],
      ["/api/v1/availability/offer-id", "DELETE"],
      ["/api/v1/reservations/reservation-id", "DELETE"],
    ] as const) {
      const response = await SELF.fetch(`https://parkventory.test${path}`, {
        method,
        headers: {
          Cookie: godmode.cookie,
          Origin: "https://parkventory.test",
          "Content-Type": "application/json",
        },
      });
      expect(response.status, `${method} ${path}`).toBe(403);
    }
  });

  it("valide les filtres et distingue 401, 400 et 404", async () => {
    expect((await SELF.fetch("https://parkventory.test/api/v1/admin/overview")).status).toBe(401);

    const godmode = await verifyGodmodeMagicLink();
    const headers = { Cookie: godmode.cookie };
    for (const path of [
      "/api/v1/admin/tenants?limit=0",
      "/api/v1/admin/tenants?cursor=*",
      "/api/v1/admin/users?tenantId=tenant%2Finvalid",
      "/api/v1/admin/activity?severity=CRITICAL",
      "/api/v1/admin/activity?reference=invalid%2Freference",
    ]) {
      expect((await SELF.fetch(`https://parkventory.test${path}`, { headers })).status, path).toBe(400);
    }
    expect((await SELF.fetch(
      "https://parkventory.test/api/v1/admin/tenants/org-does-not-exist",
      { headers },
    )).status).toBe(404);
  });

  it("attache uniquement l’identité au SYSTEM et l’exclut des statistiques", async () => {
    const godmode = await verifyGodmodeMagicLink();
    expect(godmode.response.status).toBe(200);

    const membership = await testEnv.DB.prepare(`
      SELECT organization.kind, membership.role
      FROM membership
      JOIN organization ON organization.id = membership.organization_id
      JOIN user_account ON user_account.id = membership.user_id
      WHERE user_account.normalized_email = ?1
    `).bind(godmodeEmail).first<{ kind: string; role: string }>();
    expect(membership).toEqual({ kind: "SYSTEM", role: "ADMIN" });

    const overview = await SELF.fetch("https://parkventory.test/api/v1/admin/overview", {
      headers: { Cookie: godmode.cookie },
    });
    expect(overview.status).toBe(200);
    expect(await overview.json()).toMatchObject({
      totals: { tenants: 0, users: 0, parkingSpots: 0, shares: 0, reservations: 0, activeSessions: 0 },
      period: { reservationRate: null },
      window: { days: 30, timeZone: "UTC" },
    });
  });

  it("expose les tenants, utilisateurs, événements et diagnostics sans secrets", async () => {
    const owner = await seedSession({ domain: "alpha.test", email: "owner@alpha.test" });
    const reserver = await seedSession({ domain: "alpha.test", email: "guest@alpha.test" });
    const other = await seedSession({ domain: "beta.test", email: "member@beta.test" });
    const now = Math.floor(Date.now() / 1000);
    const spotId = `spot-${crypto.randomUUID()}`;
    const offerId = `offer-${crypto.randomUUID()}`;
    const reservationId = `reservation-${crypto.randomUUID()}`;
    await testEnv.DB.batch([
      testEnv.DB.prepare(`
        INSERT INTO parking_spot (
          id, organization_id, owner_membership_id, label, level, time_zone, created_at
        ) VALUES (?1, ?2, ?3, 'A-01', 'Niveau A', 'Europe/Paris', ?4)
      `).bind(spotId, owner.orgId, owner.membershipId, now),
      testEnv.DB.prepare(`
        INSERT INTO availability_offer (
          id, organization_id, parking_spot_id, owner_membership_id,
          starts_at, ends_at, local_date, local_from, local_to, time_zone, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '2026-09-01', '08:00', '18:00', 'Europe/Paris', ?7)
      `).bind(offerId, owner.orgId, spotId, owner.membershipId, now + 3600, now + 7200, now),
      testEnv.DB.prepare(`
        INSERT INTO reservation (
          id, organization_id, availability_offer_id, reserver_membership_id,
          idempotency_key, status, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, 'CONFIRMED', ?6)
      `).bind(reservationId, owner.orgId, offerId, reserver.membershipId, crypto.randomUUID(), now),
      testEnv.DB.prepare(`
        UPDATE reservation
        SET status = 'CANCELLED', cancelled_at = ?1
        WHERE id = ?2
      `).bind(now, reservationId),
      testEnv.DB.prepare(`
        UPDATE availability_offer
        SET status = 'WITHDRAWN', withdrawn_at = ?1
        WHERE id = ?2
      `).bind(now, offerId),
    ]);
    const godmode = await verifyGodmodeMagicLink();
    const headers = { Cookie: godmode.cookie };

    const overviewResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/overview", { headers });
    const overview = await overviewResponse.json<{
      totals: Record<string, number>;
      period: Record<string, number | null>;
    }>();
    expect(overview.totals).toMatchObject({ tenants: 2, users: 3, parkingSpots: 1, shares: 1, reservations: 1, activeSessions: 3 });
    expect(overview.period).toMatchObject({
      activeUsers7d: 3,
      activeUsers30d: 3,
      withdrawals: 1,
      cancellations: 1,
      reservationRate: 1,
    });

    const tenantsResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/tenants?limit=1", { headers });
    const tenants = await tenantsResponse.json<{ items: Array<{ id: string; domain: string }>; page: { nextCursor: string | null } }>();
    expect(tenants.items).toHaveLength(1);
    expect(tenants.items.map((tenant) => tenant.domain)).not.toContain(SYSTEM_ORGANIZATION_DOMAIN);
    expect(tenants.page.nextCursor).toBeTypeOf("string");

    const tenantResponse = await SELF.fetch(`https://parkventory.test/api/v1/admin/tenants/${encodeURIComponent(owner.orgId)}`, { headers });
    const tenant = await tenantResponse.json<{
      recentMembers: unknown[];
      recentSpots: unknown[];
      recentActivity: Array<{ organization: { name: string }; actor: { email: string } | null }>;
    }>();
    expect(tenant.recentMembers).toHaveLength(2);
    expect(tenant.recentSpots).toHaveLength(1);
    expect(tenant.recentActivity.some((event) => event.organization.name === "Alpha")).toBe(true);

    const usersResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/users?limit=100", { headers });
    const users = await usersResponse.json<{ items: Array<{ email: string }> }>();
    expect(users.items.map((user) => user.email).sort()).toEqual([
      "guest@alpha.test",
      "member@beta.test",
      "owner@alpha.test",
    ]);
    expect(JSON.stringify(users)).not.toContain("token_hash");
    expect(JSON.stringify(users)).not.toContain("requested_ip_hash");

    const activityResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/activity?limit=100", { headers });
    const activity = await activityResponse.json<{
      items: Array<{ type: string; organization: { domain: string } | null; actor: { email: string } | null }>;
    }>();
    expect(activity.items.map((event) => event.type)).toEqual(expect.arrayContaining([
      "ORGANIZATION_CREATED",
      "MEMBER_REGISTERED",
      "SPOT_CREATED",
      "SHARE_PUBLISHED",
      "SHARE_WITHDRAWN",
      "RESERVATION_CONFIRMED",
      "RESERVATION_CANCELLED",
    ]));
    expect(activity.items.some((event) => event.organization?.domain === "alpha.test" && event.actor?.email === "owner@alpha.test")).toBe(true);
    expect(JSON.stringify(activity)).not.toContain("test-ip-hash");

    const referencedActivityResponse = await SELF.fetch(
      `https://parkventory.test/api/v1/admin/activity?reference=${encodeURIComponent(reservationId)}`,
      { headers },
    );
    const referencedActivity = await referencedActivityResponse.json<{
      items: Array<{ type: string; entityId: string | null }>;
    }>();
    expect(referencedActivity.items).toHaveLength(2);
    expect(referencedActivity.items.every((event) => event.entityId === reservationId)).toBe(true);

    const diagnosticsResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/diagnostics", { headers });
    const diagnostics = await diagnosticsResponse.json<{
      database: { status: string };
      integrity: { status: string; issueCount: number; checks: Array<{ key: string; count: number }> };
      authentication: { activeTenantSessions: number; activeSystemSessions: number };
    }>();
    expect(diagnostics.database.status).toBe("ok");
    expect(diagnostics.integrity).toMatchObject({ status: "healthy", issueCount: 0 });
    expect(diagnostics.integrity.checks).toHaveLength(9);
    expect(diagnostics.authentication).toMatchObject({ activeTenantSessions: 3, activeSystemSessions: 1 });

    const successfulReadAudits = await testEnv.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM activity_event
      WHERE event_type = 'GODMODE_VIEWED'
    `).first<{ count: number }>();
    expect(successfulReadAudits?.count).toBe(0);

    expect(other.orgId).not.toBe(owner.orgId);
  });

  it("bloque les incohérences tenant au schéma avant qu’elles polluent les diagnostics", async () => {
    const owner = await seedSession({ domain: "integrity-a.test", email: "owner@integrity-a.test" });
    const mismatched = await seedSession({ domain: "integrity-b.test", email: "owner@integrity-b.test" });
    await expect(testEnv.DB.prepare(`
      INSERT INTO parking_spot (
        id, organization_id, owner_membership_id, label, level, time_zone, created_at
      ) VALUES (?1, ?2, ?3, 'MISMATCH', '', 'Europe/Paris', ?4)
    `).bind(
      crypto.randomUUID(),
      owner.orgId,
      mismatched.membershipId,
      Math.floor(Date.now() / 1000),
    ).run()).rejects.toThrow(/parking_spot_tenant_integrity/);
    const godmode = await verifyGodmodeMagicLink();
    const systemMember = await testEnv.DB.prepare(`
      SELECT membership.id
      FROM membership
      JOIN organization ON organization.id = membership.organization_id
      WHERE organization.kind = 'SYSTEM'
    `).first<{ id: string }>();
    await expect(testEnv.DB.prepare(`
      INSERT INTO parking_spot (
        id, organization_id, owner_membership_id, label, level, time_zone, created_at
      ) VALUES (?1, ?2, ?3, 'SYSTEM-INVALID', '', 'Europe/Paris', ?4)
    `).bind(
      crypto.randomUUID(),
      SYSTEM_ORGANIZATION_ID,
      systemMember?.id,
      Math.floor(Date.now() / 1000),
    ).run()).rejects.toThrow(/parking_spot_tenant_integrity/);

    const response = await SELF.fetch("https://parkventory.test/api/v1/admin/diagnostics", {
      headers: { Cookie: godmode.cookie },
    });
    const body = await response.json<{
      integrity: { status: string; checks: Array<{ key: string; count: number; status: string }> };
    }>();
    expect(body.integrity.status).toBe("healthy");
    expect(body.integrity.checks).toContainEqual(expect.objectContaining({
      key: "spot_owner_tenant_mismatch",
      count: 0,
      status: "ok",
    }));
    expect(body.integrity.checks).toContainEqual(expect.objectContaining({
      key: "system_business_data",
      count: 0,
      status: "ok",
    }));
  });

  it("marque les routes privées comme non indexables", async () => {
    for (const path of ["/admin", "/app", "/auth/request"]) {
      const response = await SELF.fetch(`https://parkventory.test${path}`);
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    }
  });

  it("corrèle un incident sans exposer l’erreur brute", async () => {
    const godmode = await verifyGodmodeMagicLink();
    const expectedActor = await testEnv.DB.prepare(`
      SELECT membership.id AS membership_id, membership.organization_id, membership.user_id
      FROM membership
      JOIN organization ON organization.id = membership.organization_id
      WHERE organization.kind = 'SYSTEM'
    `).first<{ membership_id: string; organization_id: string; user_id: string }>();
    const failingDatabase = {
      prepare: (query: string) => testEnv.DB.prepare(query),
      batch: async () => {
        throw new Error("secret-database-detail");
      },
    } as unknown as D1Database;
    const response = await app.request(
      "https://parkventory.test/api/v1/admin/overview",
      { headers: { Cookie: godmode.cookie } },
      { ...bindingsWithDigest(godmodeDigest), DB: failingDatabase },
    );
    const problem = await response.json<{ detail: string }>();
    const incidentId = problem.detail.match(/[0-9a-f-]{36}$/)?.[0];
    const requestId = response.headers.get("X-Request-ID");

    expect(response.status).toBe(500);
    expect(problem.detail).not.toContain("secret-database-detail");
    expect(incidentId).toBeTypeOf("string");
    expect(requestId).toBeTypeOf("string");
    expect(requestId).not.toBe(incidentId);

    const stored = await testEnv.DB.prepare(`
      SELECT
        entity_type, entity_id, request_id, error_code,
        organization_id, user_id, membership_id
      FROM activity_event
      WHERE event_type = 'INCIDENT_RECORDED'
      ORDER BY occurred_at DESC, id DESC
      LIMIT 1
    `).first<{
      entity_type: string;
      entity_id: string;
      request_id: string;
      error_code: string;
      organization_id: string;
      user_id: string;
      membership_id: string;
    }>();
    expect(stored).toEqual({
      entity_type: "INCIDENT",
      entity_id: incidentId,
      request_id: requestId,
      error_code: expect.stringMatching(/^UNHANDLED_[0-9A-F]{16}$/),
      organization_id: expectedActor?.organization_id,
      user_id: expectedActor?.user_id,
      membership_id: expectedActor?.membership_id,
    });

    const diagnosticsResponse = await SELF.fetch("https://parkventory.test/api/v1/admin/diagnostics", {
      headers: { Cookie: godmode.cookie },
    });
    const diagnostics = await diagnosticsResponse.json<{
      incidents: { latest: Array<{ incidentId: string }> };
    }>();
    expect(diagnostics.incidents.latest).toContainEqual(expect.objectContaining({ incidentId }));
  });
});
