/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { localizedPath, supportedLocales, type Locale } from "../../shared/i18n";
import { publicContactEmail } from "../../shared/site";
import { displayName, organizationName, zonedDateTimeToEpoch } from "../src/domain";
import { isShareDateWithinSiteWindow } from "../src/index";
import { sha256 } from "../src/security";

type TestEnv = Omit<Env, "APP_ENV"> & {
  APP_ENV: "development";
  TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

const testEnv = env as unknown as TestEnv;

beforeEach(async () => {
  await applyD1Migrations(testEnv.DB, testEnv.TEST_MIGRATIONS);
});

async function seedMember({
  domain,
  email,
  token,
}: {
  domain: string;
  email: string;
  token: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const orgId = `org-${domain}`;
  const userId = `usr-${email}`;
  const membershipId = `mem-${crypto.randomUUID()}`;
  const linkId = `link-${crypto.randomUUID()}`;
  const sessionId = `session-${crypto.randomUUID()}`;
  const sessionToken = `${token}-${crypto.randomUUID()}`;
  await testEnv.DB.batch([
    testEnv.DB.prepare("INSERT OR IGNORE INTO organization VALUES (?1, ?2, ?3, ?4)")
      .bind(orgId, domain, organizationName(domain), now),
    testEnv.DB.prepare("INSERT INTO user_account VALUES (?1, ?2, ?3, ?4)")
      .bind(userId, email, displayName(email), now),
    testEnv.DB.prepare("INSERT INTO membership VALUES (?1, ?2, ?3, 'MEMBER', ?4)")
      .bind(membershipId, orgId, userId, now),
    testEnv.DB.prepare(`
      INSERT INTO magic_link_request (
        id, token_hash, normalized_email, normalized_domain, requested_ip_hash,
        expires_at, consumed_at, created_at
      ) VALUES (?1, ?2, ?3, ?4, 'ip', ?5, ?6, ?6)
    `).bind(linkId, await sha256(`link-${sessionToken}`), email, domain, now + 900, now),
    testEnv.DB.prepare(`
      INSERT INTO app_session (
        id, token_hash, magic_link_request_id, membership_id, expires_at, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `).bind(sessionId, await sha256(sessionToken), linkId, membershipId, now + 3600, now),
  ]);
  return { orgId, membershipId, token: sessionToken };
}

async function seedOffer(orgId: string, membershipId: string) {
  const now = Math.floor(Date.now() / 1000);
  const spotId = `spot-${crypto.randomUUID()}`;
  const offerId = `offer-${crypto.randomUUID()}`;
  await testEnv.DB.batch([
    testEnv.DB.prepare(`
      INSERT INTO parking_spot (
        id, organization_id, owner_membership_id, label, level, time_zone, created_at
      ) VALUES (?1, ?2, ?3, 'A-24', 'Niveau A', 'Europe/Paris', ?4)
    `).bind(spotId, orgId, membershipId, now),
    testEnv.DB.prepare(`
      INSERT INTO availability_offer (
        id, organization_id, parking_spot_id, owner_membership_id,
        starts_at, ends_at, local_date, local_from, local_to, time_zone, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '2026-08-25', '08:00', '18:00', 'Europe/Paris', ?7)
    `).bind(offerId, orgId, spotId, membershipId, now + 3600, now + 7200, now),
  ]);
  return { offerId, spotId };
}

function cookie(token: string) {
  return { Cookie: `parkventory_session=${token}` };
}

const publicLanguageExpectations = {
  fr: {
    home: ["Partagez votre place.", "Quand vous êtes absent"],
    privacy: ["Confidentialité", "Aucun outil publicitaire"],
    legal: ["Mentions légales", "bêta publique indépendante"],
  },
  en: {
    home: ["Share your space.", "When you’re away"],
    privacy: ["Privacy", "No advertising"],
    legal: ["Legal notice", "independent public beta"],
  },
  de: {
    home: ["Teilen Sie Ihren Parkplatz.", "in wenigen Sekunden"],
    privacy: ["Datenschutz", "keine Werbe- oder Reichweitenmessungsdienste"],
    legal: ["Impressum", "unabhängige öffentliche Beta"],
  },
  lb: {
    home: ["Deelt Är Parkplaz.", "an e puer Sekonnen"],
    privacy: ["Dateschutz", "keen Instrument fir Reklammen"],
    legal: ["Impressum", "onofhängeg ëffentlech Beta"],
  },
} as const satisfies Record<Locale, Record<"home" | "privacy" | "legal", readonly [string, string]>>;

describe("contrat Cloudflare MVP", () => {
  it("redirige www vers l’origine canonique sans perdre le chemin", async () => {
    const response = await SELF.fetch("https://www.parkventory.com/app/partager?jour=demain", {
      redirect: "manual",
    });

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("https://parkventory.com/app/partager?jour=demain");
  });

  it("force HTTPS sur l’origine canonique", async () => {
    const response = await SELF.fetch("http://parkventory.com/en/privacy?source=test", {
      redirect: "manual",
    });

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("https://parkventory.com/en/privacy?source=test");
  });

  it("négocie la racine avec la langue du navigateur et mémorise le cache variant", async () => {
    const response = await SELF.fetch("https://parkventory.com/", {
      headers: { "Accept-Language": "nl-NL;q=0.9, de-DE;q=0.8, fr;q=0.6" },
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://parkventory.com/de/");
    expect(response.headers.get("Vary")).toBe("Accept-Language, Cookie");
  });

  it("donne la priorité au choix de langue explicite mémorisé", async () => {
    const response = await SELF.fetch("https://parkventory.com/privacy", {
      headers: {
        "Accept-Language": "en-GB,en;q=0.9",
        Cookie: "parkventory_locale=lb",
      },
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://parkventory.com/lb/dateschutz");
  });

  it("redirige définitivement les anciennes pages françaises", async () => {
    const response = await SELF.fetch("https://parkventory.com/confidentialite", {
      headers: { "Accept-Language": "de-DE" },
      redirect: "manual",
    });

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("https://parkventory.com/fr/confidentialite");
    expect(response.headers.get("Vary")).toBeNull();
  });

  it("sert les douze pages publiques avec contenu initial, canonical et hreflang", async () => {
    for (const locale of supportedLocales) {
      for (const route of ["home", "privacy", "legal"] as const) {
        const path = localizedPath(locale, route);
        const response = await SELF.fetch(`https://parkventory.com${path}`);
        const html = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain("text/html");
        expect(response.headers.get("Content-Language")).toBe(locale);
        expect(html).toContain(`data-server-rendered="${route}"`);
        expect(html).toContain(`rel="canonical" href="https://parkventory.com${path}"`);
        expect(html.match(/rel="alternate"/g)).toHaveLength(5);
        const [heading, languageMarker] = publicLanguageExpectations[locale][route];
        expect(html).toContain(heading);
        expect(html).toContain(languageMarker);
        if (route !== "home") expect(html).toContain(`mailto:${publicContactEmail}`);
      }
    }
  });

  it("sert un HEAD public sans corps et avec les en-têtes localisés", async () => {
    const response = await SELF.fetch("https://parkventory.com/de/datenschutz", { method: "HEAD" });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Language")).toBe("de");
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(response.headers.get("ETag")).toBeNull();
    expect(response.headers.get("Last-Modified")).toBeNull();
    expect(await response.text()).toBe("");

    const missingAsset = await SELF.fetch("https://parkventory.com/missing-head.js", {
      method: "HEAD",
    });
    expect(missingAsset.status).toBe(404);
    expect(missingAsset.headers.get("Content-Type")).toContain("text/plain");
    expect(await missingAsset.text()).toBe("");
  });

  it("ne réutilise pas le validateur du shell entre deux 404 négociées", async () => {
    const response = await SELF.fetch("https://parkventory.com/unknown", {
      headers: {
        "Accept-Language": "en-GB",
        "If-None-Match": "*",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Language")).toBe("en");
    expect(response.headers.get("ETag")).toBeNull();
    expect(response.headers.get("Last-Modified")).toBeNull();
    expect(response.headers.get("Vary")).toContain("Accept-Language");
    expect(response.headers.get("Vary")).toContain("Cookie");
    expect(html).toContain("This space doesn’t exist.");
  });

  it("sert les fichiers SEO et de marque avec leur MIME et garde un asset absent en 404", async () => {
    const assets: ReadonlyArray<readonly [string, string]> = [
      ["/robots.txt", "text/plain"],
      ["/sitemap.xml", "application/xml"],
      ["/llms.txt", "text/plain"],
      ["/manifest-lb.webmanifest", "application/manifest+json"],
      ["/favicon.svg", "image/svg+xml"],
      ["/icon-192.png", "image/png"],
      ["/parkventory-social-card-de.png", "image/png"],
    ];

    for (const [path, contentType] of assets) {
      const response = await SELF.fetch(`https://parkventory.com${path}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toContain(contentType);
    }

    const missing = await SELF.fetch("https://parkventory.com/missing-asset.js");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toContain("text/plain");
  });

  it("localise les erreurs API et les maintient hors index", async () => {
    const response = await SELF.fetch("https://parkventory.test/api/v1/auth/session", {
      headers: { "X-Parkventory-Locale": "de" },
    });
    const body = await response.json<{ code: string; detail: string }>();

    expect(response.status).toBe(401);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.code).toBe("SESSION_EXPIRED");
    expect(body.detail).toContain("Ihre Sitzung ist abgelaufen");
  });

  it("convertit les heures de Paris et garde le nom de secours indépendant de la langue", () => {
    expect(zonedDateTimeToEpoch("2026-08-25", "08:00")).toBeTypeOf("number");
    expect(zonedDateTimeToEpoch("2026-03-29", "02:30")).toBeNull();
    expect(displayName("...@alpha.test", "...@alpha.test")).toBe("...@alpha.test");
  });

  it("valide la fenêtre de partage dans le fuseau du site plutôt qu’en UTC", () => {
    const nearUtcMidnight = Date.parse("2026-08-31T22:30:00.000Z") / 1000;

    expect(isShareDateWithinSiteWindow("2026-08-31", nearUtcMidnight, "Europe/Paris")).toBe(false);
    expect(isShareDateWithinSiteWindow("2026-09-01", nearUtcMidnight, "Europe/Paris")).toBe(true);
    expect(isShareDateWithinSiteWindow("2026-09-08", nearUtcMidnight, "Europe/Paris")).toBe(true);
    expect(isShareDateWithinSiteWindow("2026-09-09", nearUtcMidnight, "Europe/Paris")).toBe(false);
    expect(isShareDateWithinSiteWindow("2026-08-31", nearUtcMidnight, "America/New_York")).toBe(true);
  });

  it("n’expose aucune offre d’une autre organisation", async () => {
    const owner = await seedMember({ domain: "alpha.test", email: "owner@alpha.test", token: "owner-token" });
    await seedOffer(owner.orgId, owner.membershipId);
    const visitor = await seedMember({ domain: "beta.test", email: "visitor@beta.test", token: "visitor-token" });

    const response = await SELF.fetch("https://parkventory.test/api/v1/dashboard", {
      headers: cookie(visitor.token),
    });
    expect(response.status).toBe(200);
    const body = await response.json<{ organization: { name: string }; availability: unknown[] }>();
    expect(body.organization.name).toBe("Beta");
    expect(body.availability).toEqual([]);
  });

  it("retourne les dates brutes et un libellé localisé", async () => {
    const owner = await seedMember({ domain: "dates.test", email: "owner@dates.test", token: "owner-token" });
    await seedOffer(owner.orgId, owner.membershipId);

    const response = await SELF.fetch("https://parkventory.test/api/v1/dashboard", {
      headers: {
        ...cookie(owner.token),
        "X-Parkventory-Locale": "de",
      },
    });
    const body = await response.json<{
      availability: Array<{
        localDate: string;
        localFrom: string;
        localTo: string;
        dateLabel: string;
      }>;
    }>();

    expect(response.status).toBe(200);
    expect(body.availability[0]).toMatchObject({
      localDate: "2026-08-25",
      localFrom: "08:00",
      localTo: "18:00",
    });
    expect(body.availability[0].dateLabel).toMatch(/25\.?\s+Aug/i);
  });

  it("consomme un magic link une seule fois et établit une session serveur", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    await testEnv.DB.prepare(`
      INSERT INTO magic_link_request (
        id, token_hash, normalized_email, normalized_domain, requested_ip_hash,
        expires_at, created_at
      ) VALUES (?1, ?2, 'alex@session.test', 'session.test', 'ip', ?3, ?4)
    `).bind(crypto.randomUUID(), await sha256(token), now + 900, now).run();
    const request = () => SELF.fetch("https://parkventory.test/api/v1/auth/verify", {
      method: "POST",
      headers: {
        Origin: "https://parkventory.test",
        "Sec-Fetch-Site": "same-origin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const verified = await request();
    expect(verified.status).toBe(200);
    const setCookie = verified.headers.get("Set-Cookie");
    expect(setCookie).toContain("parkventory_session=");
    expect(setCookie).toContain("HttpOnly");

    const sessionResponse = await SELF.fetch("https://parkventory.test/api/v1/auth/session", {
      headers: { Cookie: setCookie?.split(";")[0] ?? "" },
    });
    expect(sessionResponse.status).toBe(200);
    const session = await sessionResponse.json<{ email: string; organizationName: string }>();
    expect(session).toMatchObject({ email: "alex@session.test", organizationName: "Session" });

    expect((await request()).status).toBe(400);
  });

  it("attribue une offre à exactement une réservation concurrente", async () => {
    const owner = await seedMember({ domain: "acme.test", email: "owner@acme.test", token: "owner-token" });
    const reserver = await seedMember({ domain: "acme.test", email: "guest@acme.test", token: "guest-token" });
    const { offerId } = await seedOffer(owner.orgId, owner.membershipId);
    const headers = {
      ...cookie(reserver.token),
      Origin: "https://parkventory.test",
      "Sec-Fetch-Site": "same-origin",
    };

    const [first, second] = await Promise.all([
      SELF.fetch(`https://parkventory.test/api/v1/availability/${offerId}/reservations`, {
        method: "POST",
        headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
      }),
      SELF.fetch(`https://parkventory.test/api/v1/availability/${offerId}/reservations`, {
        method: "POST",
        headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
      }),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const row = await testEnv.DB.prepare(`
      SELECT COUNT(*) AS count FROM reservation
      WHERE availability_offer_id = ?1 AND status = 'CONFIRMED'
    `).bind(offerId).first<{ count: number }>();
    expect(row?.count).toBe(1);
  });

  it("refuse deux disponibilités qui se chevauchent pour la même place", async () => {
    const owner = await seedMember({ domain: "overlap.test", email: "owner@overlap.test", token: "owner-token" });
    const { spotId } = await seedOffer(owner.orgId, owner.membershipId);
    const now = Math.floor(Date.now() / 1000);
    await expect(testEnv.DB.prepare(`
      INSERT INTO availability_offer (
        id, organization_id, parking_spot_id, owner_membership_id,
        starts_at, ends_at, local_date, local_from, local_to, time_zone, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '2026-08-25', '09:00', '11:00', 'Europe/Paris', ?7)
    `).bind(
      crypto.randomUUID(), owner.orgId, spotId, owner.membershipId,
      now + 5400, now + 9000, now,
    ).run()).rejects.toThrow(/availability_overlap/);
  });
});
