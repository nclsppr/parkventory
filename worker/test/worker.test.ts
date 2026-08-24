/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { displayName, organizationName, zonedDateTimeToEpoch } from "../src/domain";
import { sha256 } from "../src/security";

interface TestEnv extends Env {
  APP_ENV: "development";
  TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
}

const testEnv = env as TestEnv;

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

describe("contrat Cloudflare MVP", () => {
  it("convertit les heures de Paris et refuse l’heure inexistante du passage d’été", () => {
    expect(zonedDateTimeToEpoch("2026-08-25", "08:00")).toBeTypeOf("number");
    expect(zonedDateTimeToEpoch("2026-03-29", "02:30")).toBeNull();
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
