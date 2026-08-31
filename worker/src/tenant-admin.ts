import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { recordActivityEvent } from "./activity";
import { deriveBrandingPalette } from "./branding";
import type { AppEnvironment } from "./types";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const OVERVIEW_DAYS = 30;
const DEFAULT_LOGO_URL = "/parkventory-logo-transparent.svg";

interface PageCursor {
  at: number;
  id: string;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function problem(status: number, detail: string): Response {
  return Response.json({
    type: "about:blank",
    title: status >= 500 ? "Erreur du service" : "Requête refusée",
    status,
    detail,
  }, { status });
}

function validIdentifier(value: string): boolean {
  return /^[A-Za-z0-9._:-]{1,160}$/.test(value);
}

function parseLimit(value: string | undefined): number | null {
  if (value === undefined || value === "") return DEFAULT_PAGE_SIZE;
  if (!/^\d{1,3}$/.test(value)) return null;
  const limit = Number(value);
  return limit >= 1 && limit <= MAX_PAGE_SIZE ? limit : null;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function encodeCursor(cursor: PageCursor): string {
  return btoa(JSON.stringify(cursor)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCursor(value: string | undefined): PageCursor | null {
  if (!value || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as Partial<PageCursor>;
    if (!Number.isSafeInteger(parsed.at) || Number(parsed.at) < 0) return null;
    if (typeof parsed.id !== "string" || !validIdentifier(parsed.id)) return null;
    return { at: Number(parsed.at), id: parsed.id };
  } catch {
    return null;
  }
}

function utcDay(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString().slice(0, 10);
}

function numberValue(row: Record<string, unknown> | undefined, key: string): number {
  return Number(row?.[key] ?? 0);
}

function readBody<T>(request: Request): Promise<T | null> {
  return request.json<T>().catch(() => null);
}

export const requireTenantAdmin: MiddlewareHandler<AppEnvironment> = async (context, next) => {
  const member = context.get("member");
  if (member.organizationKind !== "TENANT" || member.role !== "ADMIN" || member.godmode) {
    await recordActivityEvent(context.env.DB, {
      eventType: "TENANT_ADMIN_ACCESS_DENIED",
      occurredAt: nowSeconds(),
      severity: "WARNING",
      outcome: "DENIED",
      organizationId: member.organizationKind === "TENANT" ? member.organizationId : null,
      userId: member.userId,
      membershipId: member.membershipId,
      requestId: context.get("requestId"),
      route: "/api/v1/tenant-admin/*",
      errorCode: "TENANT_ADMIN_FORBIDDEN",
      dedupeWindowSeconds: 5 * 60,
    }).catch(() => undefined);
    return problem(403, "Cet espace est réservé aux administrateurs de votre tenant.");
  }
  await next();
};

export function registerTenantAdminRoutes(app: Hono<AppEnvironment>): void {
  app.get("/api/v1/tenant-admin/overview", async (context) => {
    const member = context.get("member");
    const now = nowSeconds();
    const todayStart = Math.floor(Date.parse(`${utcDay(now)}T00:00:00.000Z`) / 1000);
    const from = todayStart - ((OVERVIEW_DAYS - 1) * 24 * 60 * 60);
    const [organizationResult, totalsResult, periodResult, shareSeries, reservationSeries] = await context.env.DB.batch([
      context.env.DB.prepare(`
        SELECT organization.id, organization.display_name, organization.normalized_domain,
          branding.enabled AS branding_enabled,
          branding.logo_url AS branding_logo_url,
          branding.logo_enabled AS branding_logo_enabled,
          branding.action_fill AS branding_action_fill,
          branding.available_fill AS branding_available_fill,
          branding.updated_at AS branding_updated_at
        FROM organization
        LEFT JOIN organization_branding branding
          ON branding.normalized_domain = organization.normalized_domain
        WHERE organization.id = ?1 AND organization.kind = 'TENANT'
      `).bind(member.organizationId),
      context.env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM membership WHERE organization_id = ?1) AS users,
          (SELECT COUNT(*) FROM membership WHERE organization_id = ?1 AND role = 'ADMIN') AS administrators,
          (SELECT COUNT(*) FROM parking_spot WHERE organization_id = ?1) AS parking_spots,
          (SELECT COUNT(*) FROM availability_offer WHERE organization_id = ?1) AS shares,
          (SELECT COUNT(*) FROM reservation WHERE organization_id = ?1) AS reservations,
          (SELECT COUNT(*) FROM app_session
            JOIN membership ON membership.id = app_session.membership_id
            WHERE membership.organization_id = ?1
              AND app_session.revoked_at IS NULL AND app_session.expires_at > ?2) AS active_sessions
      `).bind(member.organizationId, now),
      context.env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM availability_offer
            WHERE organization_id = ?1 AND created_at >= ?2) AS shares,
          (SELECT COUNT(*) FROM reservation
            WHERE organization_id = ?1 AND created_at >= ?2) AS reservations,
          (SELECT COUNT(DISTINCT activity_event.user_id) FROM activity_event
            WHERE organization_id = ?1 AND user_id IS NOT NULL AND occurred_at >= ?2) AS active_users
      `).bind(member.organizationId, from),
      context.env.DB.prepare(`
        SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS count
        FROM availability_offer
        WHERE organization_id = ?1 AND created_at >= ?2 GROUP BY day
      `).bind(member.organizationId, from),
      context.env.DB.prepare(`
        SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS count
        FROM reservation
        WHERE organization_id = ?1 AND created_at >= ?2 GROUP BY day
      `).bind(member.organizationId, from),
    ]);

    const organization = organizationResult.results[0] as Record<string, unknown> | undefined;
    if (!organization) return problem(404, "Ce tenant n’existe plus.");
    const totals = totalsResult.results[0] as Record<string, unknown> | undefined;
    const period = periodResult.results[0] as Record<string, unknown> | undefined;
    const series = new Map<string, { date: string; shares: number; reservations: number }>();
    for (let index = 0; index < OVERVIEW_DAYS; index += 1) {
      const date = utcDay(from + (index * 24 * 60 * 60));
      series.set(date, { date, shares: 0, reservations: 0 });
    }
    for (const row of shareSeries.results as Array<{ day: string; count: number }>) {
      const target = series.get(row.day);
      if (target) target.shares = Number(row.count ?? 0);
    }
    for (const row of reservationSeries.results as Array<{ day: string; count: number }>) {
      const target = series.get(row.day);
      if (target) target.reservations = Number(row.count ?? 0);
    }

    const logoUrl = organization.branding_logo_url === null ? null : String(organization.branding_logo_url);
    const logoAvailable = logoUrl !== null && logoUrl !== DEFAULT_LOGO_URL;
    return context.json({
      generatedAt: now,
      tenant: {
        id: String(organization.id),
        name: String(organization.display_name),
        domain: String(organization.normalized_domain),
      },
      totals: {
        users: numberValue(totals, "users"),
        administrators: numberValue(totals, "administrators"),
        parkingSpots: numberValue(totals, "parking_spots"),
        shares: numberValue(totals, "shares"),
        reservations: numberValue(totals, "reservations"),
        activeSessions: numberValue(totals, "active_sessions"),
      },
      period: {
        days: OVERVIEW_DAYS,
        from,
        to: now,
        shares: numberValue(period, "shares"),
        reservations: numberValue(period, "reservations"),
        activeUsers: numberValue(period, "active_users"),
      },
      series: Array.from(series.values()),
      branding: {
        configured: organization.branding_enabled !== null,
        enabled: Number(organization.branding_enabled ?? 0) === 1,
        actionColor: String(organization.branding_action_fill ?? "#C8F913"),
        availableColor: String(organization.branding_available_fill ?? "#15C9D5"),
        logoAvailable,
        logoEnabled: logoAvailable && Number(organization.branding_logo_enabled ?? 0) === 1,
        logoUrl: logoAvailable ? logoUrl : null,
        updatedAt: organization.branding_updated_at === null ? null : Number(organization.branding_updated_at),
      },
    });
  });

  app.get("/api/v1/tenant-admin/members", async (context) => {
    const member = context.get("member");
    const limit = parseLimit(context.req.query("limit"));
    const cursorValue = context.req.query("cursor");
    const cursor = decodeCursor(cursorValue);
    const query = (context.req.query("q") ?? "").trim();
    if (limit === null || (cursorValue && !cursor) || query.length > 100 || /[\u0000-\u001f]/.test(query)) {
      return problem(400, "Les paramètres de recherche ne sont pas valides.");
    }

    const clauses = ["membership.organization_id = ?1"];
    const bindings: unknown[] = [member.organizationId];
    if (query) {
      bindings.push(`%${escapeLike(query.toLowerCase())}%`);
      clauses.push(`(lower(user_account.display_name) LIKE ?${bindings.length} ESCAPE '\\'
        OR (user_account.email_erased_at IS NULL AND user_account.normalized_email LIKE ?${bindings.length} ESCAPE '\\'))`);
    }
    if (cursor) {
      bindings.push(cursor.at, cursor.id);
      clauses.push(`(membership.created_at < ?${bindings.length - 1}
        OR (membership.created_at = ?${bindings.length - 1} AND membership.id < ?${bindings.length}))`);
    }
    bindings.push(limit + 1);

    const result = await context.env.DB.prepare(`
      SELECT membership.id AS membership_id, membership.user_id, membership.role, membership.created_at,
        user_account.display_name, user_account.normalized_email, user_account.email_erased_at,
        (SELECT COUNT(*) FROM membership all_membership
          WHERE all_membership.user_id = membership.user_id) AS membership_count,
        (SELECT COUNT(*) FROM app_session WHERE app_session.membership_id = membership.id
          AND app_session.revoked_at IS NULL AND app_session.expires_at > unixepoch()) AS active_sessions,
        (SELECT MAX(activity_event.occurred_at) FROM activity_event
          WHERE activity_event.membership_id = membership.id) AS last_activity_at
      FROM membership
      JOIN user_account ON user_account.id = membership.user_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY membership.created_at DESC, membership.id DESC
      LIMIT ?${bindings.length}
    `).bind(...bindings).all<Record<string, unknown>>();

    const hasMore = result.results.length > limit;
    const rows = result.results.slice(0, limit);
    const items = rows.map((row) => {
      const emailErasedAt = row.email_erased_at === null ? null : Number(row.email_erased_at);
      return {
        membershipId: String(row.membership_id),
        userId: String(row.user_id),
        displayName: String(row.display_name),
        email: emailErasedAt === null ? String(row.normalized_email) : null,
        emailErasedAt,
        role: String(row.role),
        createdAt: Number(row.created_at),
        activeSessions: Number(row.active_sessions ?? 0),
        lastActivityAt: row.last_activity_at === null ? null : Number(row.last_activity_at),
        isSelf: String(row.membership_id) === member.membershipId,
        canEraseEmail: row.role === "MEMBER" && String(row.membership_id) !== member.membershipId
          && emailErasedAt === null && Number(row.membership_count) === 1,
      };
    });
    const last = rows.at(-1);
    return context.json({
      items,
      page: {
        nextCursor: hasMore && last
          ? encodeCursor({ at: Number(last.created_at), id: String(last.membership_id) })
          : null,
      },
    });
  });

  app.put("/api/v1/tenant-admin/branding", async (context) => {
    const member = context.get("member");
    const body = await readBody<{ enabled?: unknown; logoEnabled?: unknown; actionColor?: unknown; availableColor?: unknown }>(context.req.raw);
    if (!body || typeof body.enabled !== "boolean" || typeof body.logoEnabled !== "boolean") {
      return problem(400, "La configuration de marque n’est pas valide.");
    }
    const palette = deriveBrandingPalette(body.actionColor, body.availableColor);
    if (!palette) return problem(400, "Les couleurs doivent utiliser le format hexadécimal #RRGGBB.");

    const existing = await context.env.DB.prepare(`
      SELECT logo_url FROM organization_branding
      WHERE normalized_domain = (SELECT normalized_domain FROM organization WHERE id = ?1 AND kind = 'TENANT')
    `).bind(member.organizationId).first<{ logo_url: string }>();
    const logoUrl = existing?.logo_url ?? DEFAULT_LOGO_URL;
    const logoAvailable = logoUrl !== DEFAULT_LOGO_URL;
    if (body.logoEnabled && !logoAvailable) {
      return problem(409, "Aucun logo de tenant n’a encore été autorisé par Parkventory.");
    }
    const now = nowSeconds();
    await context.env.DB.prepare(`
      INSERT INTO organization_branding (
        normalized_domain, enabled, company_name, logo_url, logo_enabled,
        action_fill, on_action, available_fill, on_available, highlight,
        dark_action_ink, dark_available_ink, light_action_ink, light_available_ink,
        updated_at, updated_by_membership_id
      )
      SELECT organization.normalized_domain, ?2, organization.display_name, ?3, ?4,
        ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15
      FROM organization WHERE organization.id = ?1 AND organization.kind = 'TENANT'
      ON CONFLICT(normalized_domain) DO UPDATE SET
        enabled = excluded.enabled, logo_enabled = excluded.logo_enabled,
        action_fill = excluded.action_fill, on_action = excluded.on_action,
        available_fill = excluded.available_fill, on_available = excluded.on_available,
        highlight = excluded.highlight, dark_action_ink = excluded.dark_action_ink,
        dark_available_ink = excluded.dark_available_ink, light_action_ink = excluded.light_action_ink,
        light_available_ink = excluded.light_available_ink, updated_at = excluded.updated_at,
        updated_by_membership_id = excluded.updated_by_membership_id
    `).bind(
      member.organizationId, body.enabled ? 1 : 0, logoUrl, body.logoEnabled ? 1 : 0,
      palette.actionFill, palette.onAction, palette.availableFill, palette.onAvailable,
      palette.highlight, palette.darkActionInk, palette.darkAvailableInk,
      palette.lightActionInk, palette.lightAvailableInk, now, member.membershipId,
    ).run();
    await recordActivityEvent(context.env.DB, {
      eventType: "TENANT_BRANDING_UPDATED",
      occurredAt: now,
      organizationId: member.organizationId,
      userId: member.userId,
      membershipId: member.membershipId,
      entityType: "ORGANIZATION",
      entityId: member.organizationId,
      requestId: context.get("requestId"),
      route: "/api/v1/tenant-admin/branding",
    });
    return context.json({ accepted: true, message: "L’identité visuelle du tenant a été mise à jour." });
  });

  app.delete("/api/v1/tenant-admin/members/:membershipId/email", async (context) => {
    const actor = context.get("member");
    const membershipId = context.req.param("membershipId");
    if (!validIdentifier(membershipId)) return problem(400, "L’identifiant du membre n’est pas valide.");
    const body = await readBody<{ confirmation?: unknown }>(context.req.raw);
    if (!body || body.confirmation !== "EFFACER") return problem(400, "La confirmation d’effacement est requise.");
    if (membershipId === actor.membershipId) return problem(409, "Vous ne pouvez pas effacer votre propre adresse depuis cet espace.");

    const target = await context.env.DB.prepare(`
      SELECT membership.id AS membership_id, membership.user_id, membership.role,
        user_account.normalized_email, user_account.email_erased_at,
        (SELECT COUNT(*) FROM membership all_membership
          WHERE all_membership.user_id = membership.user_id) AS membership_count
      FROM membership JOIN user_account ON user_account.id = membership.user_id
      WHERE membership.id = ?1 AND membership.organization_id = ?2
    `).bind(membershipId, actor.organizationId).first<{
      membership_id: string;
      user_id: string;
      role: "MEMBER" | "ADMIN";
      normalized_email: string;
      email_erased_at: number | null;
      membership_count: number;
    }>();
    if (!target) return problem(404, "Ce membre n’existe pas dans votre tenant.");
    if (target.role !== "MEMBER") return problem(409, "Le compte d’un administrateur ne peut pas être effacé ici.");
    if (target.email_erased_at !== null) return problem(409, "Cette adresse a déjà été effacée.");
    if (Number(target.membership_count) !== 1) {
      return problem(409, "Ce compte est rattaché à plusieurs tenants et doit être traité par Parkventory.");
    }

    const now = nowSeconds();
    const erasedEmail = `erased_${crypto.randomUUID().replaceAll("-", "")}@privacy.parkventory.invalid`;
    await context.env.DB.batch([
      context.env.DB.prepare("DELETE FROM app_session WHERE membership_id = ?1").bind(target.membership_id),
      context.env.DB.prepare("DELETE FROM magic_link_request WHERE normalized_email = ?1").bind(target.normalized_email),
      context.env.DB.prepare(`UPDATE user_account
        SET normalized_email = ?1, display_name = 'Compte supprimé', email_erased_at = ?2
        WHERE id = ?3 AND email_erased_at IS NULL`).bind(erasedEmail, now, target.user_id),
      context.env.DB.prepare(`
        INSERT INTO activity_event (
          id, event_type, occurred_at, severity, outcome,
          organization_id, user_id, membership_id, entity_type, entity_id,
          request_id, route, source
        ) VALUES (?1, 'TENANT_MEMBER_EMAIL_ERASED', ?2, 'WARNING', 'SUCCESS',
          ?3, ?4, ?5, 'MEMBERSHIP', ?6, ?7,
          '/api/v1/tenant-admin/members/:membershipId/email', 'WORKER')
      `).bind(crypto.randomUUID(), now, actor.organizationId, actor.userId,
        actor.membershipId, target.membership_id, context.get("requestId")),
    ]);
    return context.json({
      accepted: true,
      message: "L’adresse e-mail a été effacée et les sessions du compte ont été supprimées. L’historique métier est conservé.",
    });
  });
}
