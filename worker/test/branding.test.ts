/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadOrganizationBranding } from "../src/branding";
import { magicLinkEmail } from "../src/email";
import type { OrganizationBranding } from "../src/types";
import { sha256 } from "../src/security";

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
    }
  }
}

const victorBuckBranding: OrganizationBranding = {
  enabled: true,
  companyName: "Victor Buck Services",
  logoUrl: "/brands/victor-buck-services/logo.svg",
  colors: {
    actionFill: "#0D92D2",
    onAction: "#030504",
    availableFill: "#E31C79",
    onAvailable: "#030504",
    highlight: "#E31C79",
    dark: {
      actionInk: "#0D92D2",
      availableInk: "#E31C79",
    },
    light: {
      actionInk: "#00537F",
      availableInk: "#C31465",
    },
  },
};

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

afterEach(async () => {
  await env.DB.prepare(`
    UPDATE organization_branding
    SET
      enabled = 1,
      action_fill = '#0D92D2',
      on_action = '#030504',
      available_fill = '#E31C79',
      on_available = '#030504',
      highlight = '#E31C79',
      dark_action_ink = '#0D92D2',
      dark_available_ink = '#E31C79',
      light_action_ink = '#00537F',
      light_available_ink = '#C31465',
      updated_at = unixepoch()
    WHERE normalized_domain = 'victorbuckservices.com'
  `).run();
});

async function verifyMember(domain: string) {
  const now = Math.floor(Date.now() / 1000);
  const email = `member-${crypto.randomUUID()}@${domain}`;
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  await env.DB.prepare(`
    INSERT INTO magic_link_request (
      id, token_hash, normalized_email, normalized_domain, requested_ip_hash,
      expires_at, created_at
    ) VALUES (?1, ?2, ?3, ?4, 'ip', ?5, ?6)
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
  const cookie = response.headers.get("Set-Cookie")?.split(";")[0] ?? "";
  return { response, cookie, email };
}

describe("branding d’organisation", () => {
  it("compose l’e-mail avec la palette exacte du domaine", async () => {
    const branding = await loadOrganizationBranding(env.DB, "victorbuckservices.com");
    expect(branding).toEqual(victorBuckBranding);
    const email = magicLinkEmail(
      "https://parkventory.test/auth/callback?token=test-token",
      branding?.colors,
    );

    expect(email.html).toContain('bgcolor="#0D92D2"');
    expect(email.html).toContain("color:#030504");
    expect(email.html).toContain('bgcolor="#E31C79"');
  });

  it("active automatiquement Victor Buck Services à la première connexion", async () => {
    const verified = await verifyMember("victorbuckservices.com");
    expect(verified.response.status).toBe(200);
    const verification = await verified.response.json<{
      branding: OrganizationBranding | null;
      organizationName: string;
    }>();
    expect(verification.branding).toEqual(victorBuckBranding);
    expect(verification.organizationName).toBe("Victor Buck Services");

    const sessionResponse = await SELF.fetch("https://parkventory.test/api/v1/auth/session", {
      headers: { Cookie: verified.cookie },
    });
    expect(sessionResponse.status).toBe(200);
    const session = await sessionResponse.json<{ branding: OrganizationBranding | null }>();
    expect(session.branding).toEqual(victorBuckBranding);

    const dashboardResponse = await SELF.fetch("https://parkventory.test/api/v1/dashboard", {
      headers: { Cookie: verified.cookie },
    });
    expect(dashboardResponse.status).toBe(200);
    const dashboard = await dashboardResponse.json<{
      branding: OrganizationBranding | null;
      organization: { name: string };
    }>();
    expect(dashboard.branding).toEqual(victorBuckBranding);
    expect(dashboard.organization.name).toBe("Victor Buck Services");
    expect(JSON.stringify(dashboard.branding)).not.toContain("victorbuckservices.com");
    expect(JSON.stringify(dashboard)).not.toContain(verified.email);
  });

  it("retourne aucun branding pour un domaine professionnel sans configuration", async () => {
    const verified = await verifyMember("unconfigured-brand.test");
    expect(verified.response.status).toBe(200);
    const verification = await verified.response.json<{ branding: OrganizationBranding | null }>();
    expect(verification.branding).toBeNull();
  });

  it.each([
    "mail.victorbuckservices.com",
    "victorbuckservices.com.evil.test",
  ])("ne fait aucune correspondance de domaine approximative pour %s", async (domain) => {
    const verified = await verifyMember(domain);
    expect(verified.response.status).toBe(200);
    const verification = await verified.response.json<{ branding: OrganizationBranding | null }>();
    expect(verification.branding).toBeNull();
  });

  it("respecte l’opt-out stocké pour le domaine", async () => {
    await env.DB.prepare(`
      UPDATE organization_branding
      SET enabled = 0, updated_at = unixepoch()
      WHERE normalized_domain = 'victorbuckservices.com'
    `).run();

    const verified = await verifyMember("victorbuckservices.com");
    expect(verified.response.status).toBe(200);
    const verification = await verified.response.json<{ branding: OrganizationBranding | null }>();
    expect(verification.branding).toBeNull();

    const dashboardResponse = await SELF.fetch("https://parkventory.test/api/v1/dashboard", {
      headers: { Cookie: verified.cookie },
    });
    const dashboard = await dashboardResponse.json<{ branding: OrganizationBranding | null }>();
    expect(dashboard.branding).toBeNull();
  });

  it("reflète une option de thème modifiée dans la configuration du domaine", async () => {
    await env.DB.prepare(`
      UPDATE organization_branding
      SET action_fill = '#112233', updated_at = unixepoch()
      WHERE normalized_domain = 'victorbuckservices.com'
    `).run();

    const verified = await verifyMember("victorbuckservices.com");
    expect(verified.response.status).toBe(200);
    const verification = await verified.response.json<{ branding: OrganizationBranding | null }>();
    expect(verification.branding?.colors.actionFill).toBe("#112233");
  });

  it("refuse les couleurs non hexadécimales et les logos hors origine", async () => {
    await expect(env.DB.prepare(`
      UPDATE organization_branding
      SET action_fill = 'blue'
      WHERE normalized_domain = 'victorbuckservices.com'
    `).run()).rejects.toThrow();

    await expect(env.DB.prepare(`
      UPDATE organization_branding
      SET logo_url = 'https://example.com/logo.svg'
      WHERE normalized_domain = 'victorbuckservices.com'
    `).run()).rejects.toThrow();
  });
});
