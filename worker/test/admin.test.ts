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

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await testEnv.DB.prepare(`
    INSERT OR IGNORE INTO organization (
      id, normalized_domain, display_name, created_at, kind
    ) VALUES (?1, ?2, 'Parkventory', unixepoch(), 'SYSTEM')
  `).bind(SYSTEM_ORGANIZATION_ID, SYSTEM_ORGANIZATION_DOMAIN).run();
  await testEnv.DB.prepare(`
    CREATE TRIGGER IF NOT EXISTS system_organization_required
    BEFORE DELETE ON organization
    WHEN OLD.kind = 'SYSTEM'
    BEGIN
      SELECT RAISE(ABORT, 'system_organization_required');
    END
  `).run();
  await testEnv.DB.prepare(`
    CREATE TRIGGER IF NOT EXISTS parking_spot_tenant_integrity_insert
    BEFORE INSERT ON parking_spot
    WHEN NOT EXISTS (
      SELECT 1
      FROM organization
      JOIN membership ON membership.id = NEW.owner_membership_id
      WHERE organization.id = NEW.organization_id
        AND organization.kind = 'TENANT'
        AND membership.organization_id = NEW.organization_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'parking_spot_tenant_integrity');
    END
  `).run();
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

function databaseFailingRun(queryFragment: string, rawMessage: string): D1Database {
  const wrapStatement = (statement: D1PreparedStatement): D1PreparedStatement => new Proxy(statement, {
    get(target, property) {
      if (property === "bind") {
        return (...values: unknown[]) => wrapStatement(target.bind(...values));
      }
      if (property === "run") {
        return () => Promise.reject(new Error(rawMessage));
      }
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  return new Proxy(testEnv.DB, {
    get(target, property) {
      if (property === "prepare") {
        return (query: string) => {
          const statement = target.prepare(query);
          return query.includes(queryFragment) ? wrapStatement(statement) : statement;
        };
      }
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
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
    const tenantAdminIntegrityResponse = await SELF.fetch(
      "https://parkventory.test/api/v1/admin/diagnostics/integrity?check=tenant_without_member",
      { headers: sessionHeaders(tenantAdmin.token) },
    );
    expect(tenantAdminIntegrityResponse.status).toBe(403);
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
    expect((await SELF.fetch(
      "https://parkventory.test/api/v1/admin/diagnostics/integrity?check=tenant_without_member",
    )).status).toBe(401);

    const godmode = await verifyGodmodeMagicLink();
    const headers = { Cookie: godmode.cookie };
    const wrongCheckCursor = btoa(JSON.stringify({
      check: "tenant_without_member",
      primary: "org-example",
      secondary: "",
    })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    for (const path of [
      "/api/v1/admin/tenants?limit=0",
      "/api/v1/admin/tenants?cursor=*",
      "/api/v1/admin/users?tenantId=tenant%2Finvalid",
      "/api/v1/admin/activity?severity=CRITICAL",
      "/api/v1/admin/activity?errorCode=unhandled_invalid",
      "/api/v1/admin/activity?errorCode=INVALID%2FCODE",
      "/api/v1/admin/activity?reference=invalid%2Freference",
      "/api/v1/admin/diagnostics/integrity",
      "/api/v1/admin/diagnostics/integrity?check=unknown_check",
      "/api/v1/admin/diagnostics/integrity?check=tenant_without_member&limit=0",
      "/api/v1/admin/diagnostics/integrity?check=tenant_without_member&cursor=*",
      `/api/v1/admin/diagnostics/integrity?check=spot_owner_tenant_mismatch&cursor=${wrongCheckCursor}`,
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

    for (const check of diagnostics.integrity.checks) {
      const integrityResponse = await SELF.fetch(
        `https://parkventory.test/api/v1/admin/diagnostics/integrity?check=${check.key}`,
        { headers },
      );
      expect(integrityResponse.status, check.key).toBe(200);
      expect(await integrityResponse.json(), check.key).toEqual({
        check: check.key,
        items: [],
        page: { nextCursor: null },
      });
    }

    const successfulReadAudits = await testEnv.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM activity_event
      WHERE event_type = 'GODMODE_VIEWED'
    `).first<{ count: number }>();
    expect(successfulReadAudits?.count).toBe(0);

    expect(other.orgId).not.toBe(owner.orgId);
  });

  it("filtre le journal sur un code d’erreur exact et dispose de l’index dédié", async () => {
    const godmode = await verifyGodmodeMagicLink();
    const now = Math.floor(Date.now() / 1000);
    const expectedCode = "UNHANDLED_AAAAAAAAAAAAAAAA";
    const otherCode = "UNHANDLED_BBBBBBBBBBBBBBBB";
    await testEnv.DB.batch([
      testEnv.DB.prepare(`
        INSERT INTO activity_event (
          id, event_type, occurred_at, severity, outcome,
          entity_type, entity_id, request_id, route, error_code, source
        ) VALUES (
          'evt-error-code-a', 'INCIDENT_RECORDED', ?1, 'ERROR', 'FAILED',
          'INCIDENT', 'incident-a', 'request-a', '/api/v1/spots', ?2, 'WORKER'
        )
      `).bind(now, expectedCode),
      testEnv.DB.prepare(`
        INSERT INTO activity_event (
          id, event_type, occurred_at, severity, outcome,
          entity_type, entity_id, request_id, route, error_code, source
        ) VALUES (
          'evt-error-code-b', 'INCIDENT_RECORDED', ?1, 'ERROR', 'FAILED',
          'INCIDENT', 'incident-b', 'request-b', '/api/v1/shares', ?2, 'WORKER'
        )
      `).bind(now, otherCode),
    ]);

    const response = await SELF.fetch(
      `https://parkventory.test/api/v1/admin/activity?errorCode=${expectedCode}`,
      { headers: { Cookie: godmode.cookie } },
    );
    expect(response.status).toBe(200);
    const body = await response.json<{
      items: Array<{ id: string; errorCode: string | null }>;
    }>();
    expect(body.items.map(({ id, errorCode }) => ({ id, errorCode })))
      .toEqual([{ id: "evt-error-code-a", errorCode: expectedCode }]);

    const indexes = await testEnv.DB.prepare("PRAGMA index_list('activity_event')")
      .all<{ name: string; partial: number }>();
    expect(indexes.results).toContainEqual(expect.objectContaining({
      name: "activity_event_error_time_idx",
      partial: 1,
    }));
    const availabilityIndexes = await testEnv.DB.prepare("PRAGMA index_list('availability_offer')")
      .all<{ name: string; partial: number }>();
    expect(availabilityIndexes.results).toContainEqual(expect.objectContaining({
      name: "availability_spot_active_window_idx",
      partial: 1,
    }));
  });

  it("pagine les lignes d’intégrité avec des identifiants internes sans PII", async () => {
    const tenant = await seedSession({
      domain: "integrity-target.test",
      email: "owner@integrity-target.test",
    });
    const firstForeignOwner = await seedSession({
      domain: "integrity-foreign-a.test",
      email: "foreign-a@integrity-foreign-a.test",
    });
    const secondForeignOwner = await seedSession({
      domain: "integrity-foreign-b.test",
      email: "foreign-b@integrity-foreign-b.test",
    });
    await testEnv.DB.exec("DROP TRIGGER parking_spot_tenant_integrity_insert");
    const now = Math.floor(Date.now() / 1000);
    await testEnv.DB.batch([
      testEnv.DB.prepare(`
        INSERT INTO parking_spot (
          id, organization_id, owner_membership_id, label, level, time_zone, created_at
        ) VALUES ('spot-integrity-01', ?1, ?2, 'Mismatch 1', '', 'Europe/Paris', ?3)
      `).bind(tenant.orgId, firstForeignOwner.membershipId, now),
      testEnv.DB.prepare(`
        INSERT INTO parking_spot (
          id, organization_id, owner_membership_id, label, level, time_zone, created_at
        ) VALUES ('spot-integrity-02', ?1, ?2, 'Mismatch 2', '', 'Europe/Paris', ?3)
      `).bind(tenant.orgId, secondForeignOwner.membershipId, now),
    ]);
    const godmode = await verifyGodmodeMagicLink();
    const headers = { Cookie: godmode.cookie };

    const firstResponse = await SELF.fetch(
      "https://parkventory.test/api/v1/admin/diagnostics/integrity?check=spot_owner_tenant_mismatch&limit=1",
      { headers },
    );
    expect(firstResponse.status).toBe(200);
    const firstPage = await firstResponse.json<{
      check: string;
      items: Array<{
        issueKind: string;
        organizationId: string | null;
        references: Array<{ type: string; id: string }>;
        occurrences: number;
      }>;
      page: { nextCursor: string | null };
    }>();
    expect(firstPage).toMatchObject({
      check: "spot_owner_tenant_mismatch",
      items: [{
        issueKind: "ROW",
        organizationId: tenant.orgId,
        references: [
          { type: "PARKING_SPOT", id: "spot-integrity-01" },
          { type: "MEMBERSHIP", id: firstForeignOwner.membershipId },
        ],
        occurrences: 1,
      }],
    });
    expect(firstPage.page.nextCursor).toBeTypeOf("string");

    const secondResponse = await SELF.fetch(
      `https://parkventory.test/api/v1/admin/diagnostics/integrity?check=spot_owner_tenant_mismatch&limit=1&cursor=${firstPage.page.nextCursor}`,
      { headers },
    );
    expect(secondResponse.status).toBe(200);
    const secondPage = await secondResponse.json<typeof firstPage>();
    expect(secondPage).toMatchObject({
      check: "spot_owner_tenant_mismatch",
      items: [{
        issueKind: "ROW",
        organizationId: tenant.orgId,
        references: [
          { type: "PARKING_SPOT", id: "spot-integrity-02" },
          { type: "MEMBERSHIP", id: secondForeignOwner.membershipId },
        ],
        occurrences: 1,
      }],
      page: { nextCursor: null },
    });
    const serialized = JSON.stringify([firstPage, secondPage]);
    expect(serialized).not.toContain("owner@integrity-target.test");
    expect(serialized).not.toContain("foreign-a@integrity-foreign-a.test");
    expect(serialized).not.toContain("foreign-b@integrity-foreign-b.test");
    expect(serialized).not.toContain("token_hash");
    expect(serialized).not.toContain("requested_ip_hash");

    const mismatchedCursorResponse = await SELF.fetch(
      `https://parkventory.test/api/v1/admin/diagnostics/integrity?check=tenant_without_member&cursor=${firstPage.page.nextCursor}`,
      { headers },
    );
    expect(mismatchedCursorResponse.status).toBe(400);
  });

  it("représente explicitement une organisation SYSTEM manquante sans inventer de référence", async () => {
    await testEnv.DB.exec("DROP TRIGGER system_organization_required");
    await testEnv.DB.prepare("DELETE FROM organization WHERE id = ?1")
      .bind(SYSTEM_ORGANIZATION_ID).run();
    const syntheticMember = {
      session_id: "session-synthetic-godmode",
      membership_id: "membership-synthetic-godmode",
      organization_id: SYSTEM_ORGANIZATION_ID,
      organization_kind: "SYSTEM",
      organization_name: "Parkventory",
      user_id: "user-synthetic-godmode",
      email: godmodeEmail,
      display_name: "Godmode",
      role: "ADMIN",
      branding_enabled: null,
    };
    const missingSystemDatabase = {
      prepare(query: string) {
        if (query.includes("FROM app_session session")) {
          return {
            bind: () => ({
              first: () => Promise.resolve(syntheticMember),
            }),
          };
        }
        return testEnv.DB.prepare(query);
      },
    } as unknown as D1Database;

    const response = await app.request(
      "https://parkventory.test/api/v1/admin/diagnostics/integrity?check=system_organization_count",
      { headers: sessionHeaders("synthetic-token") },
      { ...bindingsWithDigest(godmodeDigest), DB: missingSystemDatabase },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      check: "system_organization_count",
      items: [{
        issueKind: "MISSING",
        organizationId: null,
        references: [],
        occurrences: 1,
      }],
      page: { nextCursor: null },
    });
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

  it("relaie les erreurs D1 inattendues des écritures vers un incident 500 corrélé", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const spotMember = await seedSession({
      domain: "unexpected-spot.test",
      email: "member@unexpected-spot.test",
    });
    const spotResponse = await app.request(
      "https://parkventory.test/api/v1/spots",
      {
        method: "POST",
        headers: {
          ...sessionHeaders(spotMember.token),
          Origin: "https://parkventory.test",
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: "A-01", level: "Niveau A" }),
      },
      {
        ...bindingsWithDigest(godmodeDigest),
        DB: databaseFailingRun("INSERT INTO parking_spot (", "raw-unexpected-spot-error"),
      },
    );
    const spotProblem = await spotResponse.json<{ detail: string }>();
    expect(spotResponse.status).toBe(500);
    expect(spotProblem.detail).toMatch(/Référence : [0-9a-f-]{36}$/);
    expect(spotProblem.detail).not.toContain("raw-unexpected-spot-error");

    const owner = await seedSession({
      domain: "unexpected-reservation.test",
      email: "owner@unexpected-reservation.test",
    });
    const reserver = await seedSession({
      domain: "unexpected-reservation.test",
      email: "reserver@unexpected-reservation.test",
    });
    const now = Math.floor(Date.now() / 1000);
    const spotId = `spot-${crypto.randomUUID()}`;
    const offerId = `offer-${crypto.randomUUID()}`;
    await testEnv.DB.batch([
      testEnv.DB.prepare(`
        INSERT INTO parking_spot (
          id, organization_id, owner_membership_id, label, level, time_zone, created_at
        ) VALUES (?1, ?2, ?3, 'R-01', '', 'Europe/Paris', ?4)
      `).bind(spotId, owner.orgId, owner.membershipId, now),
      testEnv.DB.prepare(`
        INSERT INTO availability_offer (
          id, organization_id, parking_spot_id, owner_membership_id,
          starts_at, ends_at, local_date, local_from, local_to, time_zone, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '2026-09-01', '08:00', '18:00', 'Europe/Paris', ?7)
      `).bind(offerId, owner.orgId, spotId, owner.membershipId, now + 3600, now + 7200, now),
    ]);
    const reservationResponse = await app.request(
      `https://parkventory.test/api/v1/availability/${offerId}/reservations`,
      {
        method: "POST",
        headers: {
          ...sessionHeaders(reserver.token),
          Origin: "https://parkventory.test",
          "Sec-Fetch-Site": "same-origin",
          "Idempotency-Key": crypto.randomUUID(),
        },
      },
      {
        ...bindingsWithDigest(godmodeDigest),
        DB: databaseFailingRun("INSERT INTO reservation (", "raw-unexpected-reservation-error"),
      },
    );
    const reservationProblem = await reservationResponse.json<{ detail: string }>();
    expect(reservationResponse.status).toBe(500);
    expect(reservationProblem.detail).toMatch(/Référence : [0-9a-f-]{36}$/);
    expect(reservationProblem.detail).not.toContain("raw-unexpected-reservation-error");

    const incidents = await testEnv.DB.prepare(`
      SELECT route, error_code, entity_type, entity_id
      FROM activity_event
      WHERE event_type = 'INCIDENT_RECORDED'
      ORDER BY route
    `).all<{
      route: string;
      error_code: string;
      entity_type: string;
      entity_id: string;
    }>();
    expect(incidents.results).toEqual([
      {
        route: "/api/v1/availability/:id/reservations",
        error_code: expect.stringMatching(/^UNHANDLED_[0-9A-F]{16}$/),
        entity_type: "INCIDENT",
        entity_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      },
      {
        route: "/api/v1/spots",
        error_code: expect.stringMatching(/^UNHANDLED_[0-9A-F]{16}$/),
        entity_type: "INCIDENT",
        entity_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      },
    ]);
    const disguisedConflicts = await testEnv.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM activity_event
      WHERE event_type = 'BUSINESS_RULE_REJECTED'
        AND error_code IN ('SPOT_ALREADY_DECLARED', 'RESERVATION_WRITE_CONFLICT')
    `).first<{ count: number }>();
    expect(disguisedConflicts?.count).toBe(0);
    expect(errorLog).toHaveBeenCalledTimes(2);
    errorLog.mockRestore();
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
