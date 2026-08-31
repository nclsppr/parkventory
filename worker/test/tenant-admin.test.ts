/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { colorContrast, deriveBrandingPalette } from "../src/branding";
import { sha256 } from "../src/security";

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
    }
  }
}

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.batch([
    env.DB.prepare("UPDATE organization_branding SET updated_by_membership_id = NULL"),
    env.DB.prepare("DELETE FROM activity_event"),
    env.DB.prepare("DELETE FROM reservation"),
    env.DB.prepare("DELETE FROM availability_offer"),
    env.DB.prepare("DELETE FROM parking_spot"),
    env.DB.prepare("DELETE FROM app_session"),
    env.DB.prepare("DELETE FROM magic_link_request"),
    env.DB.prepare("DELETE FROM membership"),
    env.DB.prepare("DELETE FROM user_account"),
    env.DB.prepare("DELETE FROM organization WHERE kind = 'TENANT'"),
  ]);
  await env.DB.prepare(`
    UPDATE organization_branding
    SET enabled = 1, logo_enabled = 1, updated_by_membership_id = NULL,
      action_fill = '#0D92D2', on_action = '#030504',
      available_fill = '#E31C79', on_available = '#030504',
      highlight = '#E31C79', dark_action_ink = '#0D92D2',
      dark_available_ink = '#E31C79', light_action_ink = '#00537F',
      light_available_ink = '#C31465', updated_at = unixepoch()
    WHERE normalized_domain = 'victorbuckservices.com'
  `).run();
});

async function verifyMember(domain: string, email: string) {
  const now = Math.floor(Date.now() / 1000);
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
  await env.DB.prepare(`
    INSERT INTO magic_link_request (
      id, token_hash, normalized_email, normalized_domain, requested_ip_hash,
      expires_at, created_at
    ) VALUES (?1, ?2, ?3, ?4, 'test-ip', ?5, ?6)
  `).bind(crypto.randomUUID(), await sha256(token), email, domain, now + 900, now).run();
  const response = await SELF.fetch("https://parkventory.test/api/v1/auth/verify", {
    method: "POST",
    headers: {
      Origin: "https://parkventory.test",
      "Sec-Fetch-Site": "same-origin",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  expect(response.status).toBe(200);
  const cookie = response.headers.get("Set-Cookie")?.split(";")[0] ?? "";
  const identity = await env.DB.prepare(`
    SELECT membership.id AS membership_id, membership.user_id, membership.organization_id
    FROM membership JOIN user_account ON user_account.id = membership.user_id
    WHERE user_account.normalized_email = ?1
  `).bind(email).first<{ membership_id: string; user_id: string; organization_id: string }>();
  expect(identity).toBeTruthy();
  return { cookie, ...identity! };
}

function getHeaders(cookie: string) {
  return { Cookie: cookie };
}

function mutationHeaders(cookie: string) {
  return {
    Cookie: cookie,
    Origin: "https://parkventory.test",
    "Sec-Fetch-Site": "same-origin",
    "Content-Type": "application/json",
  };
}

describe("administration du tenant", () => {
  it("refuse un membre simple et journalise le refus sans PII", async () => {
    const member = await verifyMember("alpha.example", "membre@alpha.example");
    const response = await SELF.fetch("https://parkventory.test/api/v1/tenant-admin/overview", {
      headers: getHeaders(member.cookie),
    });
    expect(response.status).toBe(403);
    const event = await env.DB.prepare(`
      SELECT event_type, route, error_code FROM activity_event
      WHERE event_type = 'TENANT_ADMIN_ACCESS_DENIED'
    `).first<Record<string, unknown>>();
    expect(event).toEqual({
      event_type: "TENANT_ADMIN_ACCESS_DENIED",
      route: "/api/v1/tenant-admin/*",
      error_code: "TENANT_ADMIN_FORBIDDEN",
    });
    expect(JSON.stringify(event)).not.toContain("membre@alpha.example");
  });

  it("retourne uniquement les statistiques et membres du tenant de la session", async () => {
    const admin = await verifyMember("alpha.example", "admin@alpha.example");
    const colleague = await verifyMember("alpha.example", "collegue@alpha.example");
    await verifyMember("beta.example", "secret@beta.example");
    await env.DB.prepare("UPDATE membership SET role = 'ADMIN' WHERE id = ?1")
      .bind(admin.membership_id).run();

    const overviewResponse = await SELF.fetch("https://parkventory.test/api/v1/tenant-admin/overview", {
      headers: getHeaders(admin.cookie),
    });
    expect(overviewResponse.status).toBe(200);
    const overview = await overviewResponse.json<{ tenant: { domain: string }; totals: { users: number; administrators: number } }>();
    expect(overview.tenant.domain).toBe("alpha.example");
    expect(overview.totals).toMatchObject({ users: 2, administrators: 1 });

    const membersResponse = await SELF.fetch("https://parkventory.test/api/v1/tenant-admin/members", {
      headers: getHeaders(admin.cookie),
    });
    const membersText = await membersResponse.text();
    expect(membersResponse.status).toBe(200);
    expect(membersText).toContain("collegue@alpha.example");
    expect(membersText).not.toContain("secret@beta.example");
    expect(membersText).toContain(colleague.membership_id);
  });

  it("dérive une palette accessible et ne modifie que la marque du tenant courant", async () => {
    const admin = await verifyMember("victorbuckservices.com", "admin@victorbuckservices.com");
    await env.DB.prepare("UPDATE membership SET role = 'ADMIN' WHERE id = ?1")
      .bind(admin.membership_id).run();
    const response = await SELF.fetch("https://parkventory.test/api/v1/tenant-admin/branding", {
      method: "PUT",
      headers: mutationHeaders(admin.cookie),
      body: JSON.stringify({
        enabled: true,
        logoEnabled: false,
        actionColor: "#336699",
        availableColor: "#F0A010",
      }),
    });
    expect(response.status).toBe(200);
    const row = await env.DB.prepare(`
      SELECT enabled, logo_enabled, action_fill, available_fill,
        dark_action_ink, dark_available_ink, light_action_ink, light_available_ink,
        updated_by_membership_id
      FROM organization_branding WHERE normalized_domain = 'victorbuckservices.com'
    `).first<Record<string, unknown>>();
    expect(row).toMatchObject({
      enabled: 1,
      logo_enabled: 0,
      action_fill: "#336699",
      available_fill: "#F0A010",
      updated_by_membership_id: admin.membership_id,
    });
    expect(colorContrast(String(row?.dark_action_ink), "#030504")).toBeGreaterThanOrEqual(4.5);
    expect(colorContrast(String(row?.dark_available_ink), "#030504")).toBeGreaterThanOrEqual(4.5);
    expect(colorContrast(String(row?.light_action_ink), "#F4F6F1")).toBeGreaterThanOrEqual(4.5);
    expect(colorContrast(String(row?.light_available_ink), "#F4F6F1")).toBeGreaterThanOrEqual(4.5);
  });

  it("efface l’e-mail d’un membre, révoque ses sessions, garde l’historique et permet sa réactivation", async () => {
    const admin = await verifyMember("alpha.example", "admin@alpha.example");
    const targetEmail = "cible@alpha.example";
    const target = await verifyMember("alpha.example", targetEmail);
    await env.DB.prepare("UPDATE membership SET role = 'ADMIN' WHERE id = ?1")
      .bind(admin.membership_id).run();
    await env.DB.prepare(`
      INSERT INTO activity_event (
        id, event_type, occurred_at, organization_id, user_id, membership_id,
        entity_type, entity_id, source
      ) VALUES (?1, 'TEST_HISTORY', unixepoch(), ?2, ?3, ?4, 'MEMBERSHIP', ?4, 'WORKER')
    `).bind(crypto.randomUUID(), admin.organization_id, target.user_id, target.membership_id).run();

    const response = await SELF.fetch(
      `https://parkventory.test/api/v1/tenant-admin/members/${encodeURIComponent(target.membership_id)}/email`,
      {
        method: "DELETE",
        headers: mutationHeaders(admin.cookie),
        body: JSON.stringify({ confirmation: "EFFACER" }),
      },
    );
    expect(response.status).toBe(200);
    const erased = await env.DB.prepare(`
      SELECT normalized_email, display_name, email_erased_at FROM user_account WHERE id = ?1
    `).bind(target.user_id).first<{ normalized_email: string; display_name: string; email_erased_at: number | null }>();
    expect(erased?.normalized_email).toMatch(/^erased_[a-f0-9]+@privacy\.parkventory\.invalid$/);
    expect(erased?.display_name).toBe("Compte supprimé");
    expect(erased?.email_erased_at).not.toBeNull();
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM membership WHERE id = ?1").bind(target.membership_id).first()).toEqual({ count: 1 });
    const retainedHistory = await env.DB.prepare(`
      SELECT COUNT(*) AS count FROM activity_event WHERE user_id = ?1 AND event_type = 'TEST_HISTORY'
    `).bind(target.user_id).first();
    expect(retainedHistory).toEqual({ count: 1 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM app_session WHERE membership_id = ?1").bind(target.membership_id).first()).toEqual({ count: 0 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM magic_link_request WHERE normalized_email = ?1").bind(targetEmail).first()).toEqual({ count: 0 });

    const oldSession = await SELF.fetch("https://parkventory.test/api/v1/auth/session", {
      headers: getHeaders(target.cookie),
    });
    expect(oldSession.status).toBe(401);

    const events = await env.DB.prepare(`
      SELECT event_type, route, entity_id FROM activity_event
      WHERE event_type = 'TENANT_MEMBER_EMAIL_ERASED'
    `).all<Record<string, unknown>>();
    expect(JSON.stringify(events.results)).not.toContain(targetEmail);

    const reactivated = await verifyMember("alpha.example", targetEmail);
    expect(reactivated.user_id).toBe(target.user_id);
    expect(reactivated.membership_id).toBe(target.membership_id);
    const restored = await env.DB.prepare(`
      SELECT normalized_email, email_erased_at FROM user_account WHERE id = ?1
    `).bind(target.user_id).first();
    expect(restored).toEqual({ normalized_email: targetEmail, email_erased_at: null });
  });

  it("refuse l’effacement de soi-même, d’un admin et d’un compte multi-tenant", async () => {
    const admin = await verifyMember("alpha.example", "admin@alpha.example");
    await env.DB.prepare("UPDATE membership SET role = 'ADMIN' WHERE id = ?1")
      .bind(admin.membership_id).run();
    const selfResponse = await SELF.fetch(
      `https://parkventory.test/api/v1/tenant-admin/members/${admin.membership_id}/email`,
      { method: "DELETE", headers: mutationHeaders(admin.cookie), body: JSON.stringify({ confirmation: "EFFACER" }) },
    );
    expect(selfResponse.status).toBe(409);

    const secondAdmin = await verifyMember("alpha.example", "second-admin@alpha.example");
    await env.DB.prepare("UPDATE membership SET role = 'ADMIN' WHERE id = ?1").bind(secondAdmin.membership_id).run();
    const adminResponse = await SELF.fetch(
      `https://parkventory.test/api/v1/tenant-admin/members/${secondAdmin.membership_id}/email`,
      { method: "DELETE", headers: mutationHeaders(admin.cookie), body: JSON.stringify({ confirmation: "EFFACER" }) },
    );
    expect(adminResponse.status).toBe(409);
    await expect(env.DB.prepare(`
      UPDATE user_account
      SET normalized_email = 'erased_direct@privacy.parkventory.invalid', email_erased_at = unixepoch()
      WHERE id = ?1
    `).bind(secondAdmin.user_id).run()).rejects.toThrow("user_account_email_erasure_invalid");

    const shared = await verifyMember("alpha.example", "shared@alpha.example");
    await env.DB.prepare(`
      INSERT INTO organization (id, normalized_domain, display_name, created_at, kind)
      VALUES ('org-second', 'second.example', 'Second', unixepoch(), 'TENANT')
    `).run();
    await env.DB.prepare(`
      INSERT INTO membership (id, organization_id, user_id, role, created_at)
      VALUES ('mem-second', 'org-second', ?1, 'MEMBER', unixepoch())
    `).bind(shared.user_id).run();
    const multiResponse = await SELF.fetch(
      `https://parkventory.test/api/v1/tenant-admin/members/${shared.membership_id}/email`,
      { method: "DELETE", headers: mutationHeaders(admin.cookie), body: JSON.stringify({ confirmation: "EFFACER" }) },
    );
    expect(multiResponse.status).toBe(409);
  });
});

describe("palette du tenant", () => {
  it("normalise les couleurs et choisit des contrastes lisibles", () => {
    const palette = deriveBrandingPalette("#0d92d2", "#e31c79");
    expect(palette).not.toBeNull();
    expect(palette?.actionFill).toBe("#0D92D2");
    expect(palette?.availableFill).toBe("#E31C79");
    expect(colorContrast(palette!.onAction, palette!.actionFill)).toBeGreaterThanOrEqual(4.5);
    expect(colorContrast(palette!.onAvailable, palette!.availableFill)).toBeGreaterThanOrEqual(4.5);
  });

  it("rejette tout format autre que #RRGGBB", () => {
    expect(deriveBrandingPalette("blue", "#E31C79")).toBeNull();
    expect(deriveBrandingPalette("#12345678", "#E31C79")).toBeNull();
  });
});
