import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { recordActivityEvent } from "./activity";
import type { ActivityOutcome, ActivitySeverity } from "./activity";
import type { AppEnvironment } from "./types";

export const SYSTEM_ORGANIZATION_ID = "org_system_parkventory";
export const SYSTEM_ORGANIZATION_DOMAIN = "system.parkventory.invalid";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_ACTIVITY_PAGE_SIZE = 50;
const DEFAULT_INTEGRITY_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const OVERVIEW_DAYS = 30;

const INTEGRITY_CHECK_KEYS = [
  "tenant_without_member",
  "spot_owner_tenant_mismatch",
  "offer_spot_owner_mismatch",
  "reservation_offer_member_mismatch",
  "active_offer_overlap",
  "multiple_confirmed_reservations",
  "system_organization_count",
  "system_membership_invalid",
  "system_business_data",
] as const;

type IntegrityCheckKey = typeof INTEGRITY_CHECK_KEYS[number];
type IntegrityIssueKind = "ROW" | "MISSING";
type IntegrityReferenceType =
  | "ORGANIZATION"
  | "MEMBERSHIP"
  | "PARKING_SPOT"
  | "AVAILABILITY_OFFER"
  | "RESERVATION";

interface PageCursor {
  at: number;
  id: string;
}

interface IntegrityCursor {
  check: IntegrityCheckKey;
  primary: string;
  secondary: string;
}

interface IntegrityIssueRow {
  issue_kind: IntegrityIssueKind;
  organization_id: string | null;
  reference_1_type: IntegrityReferenceType | null;
  reference_1_id: string | null;
  reference_2_type: IntegrityReferenceType | null;
  reference_2_id: string | null;
  reference_3_type: IntegrityReferenceType | null;
  reference_3_id: string | null;
  occurrences: number;
  sort_primary: string;
  sort_secondary: string;
}

interface ActivityRow {
  id: string;
  event_type: string;
  occurred_at: number;
  severity: ActivitySeverity;
  outcome: ActivityOutcome;
  organization_id: string | null;
  user_id: string | null;
  membership_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  request_id: string | null;
  route: string | null;
  error_code: string | null;
  organization_name: string | null;
  organization_domain: string | null;
  actor_display_name: string | null;
  actor_email: string | null;
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

function encodeCursor(cursor: PageCursor): string {
  return btoa(JSON.stringify(cursor))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeCursor(value: string | undefined): PageCursor | null {
  if (!value) return null;
  if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as Partial<PageCursor>;
    if (!Number.isSafeInteger(parsed.at) || Number(parsed.at) < 0) return null;
    if (typeof parsed.id !== "string" || parsed.id.length < 1 || parsed.id.length > 160) return null;
    return { at: Number(parsed.at), id: parsed.id };
  } catch {
    return null;
  }
}

function isIntegrityCheckKey(value: string): value is IntegrityCheckKey {
  return (INTEGRITY_CHECK_KEYS as readonly string[]).includes(value);
}

function encodeIntegrityCursor(cursor: IntegrityCursor): string {
  return btoa(JSON.stringify(cursor))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeIntegrityCursor(
  value: string | undefined,
  expectedCheck: IntegrityCheckKey,
): IntegrityCursor | null {
  if (!value || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as Partial<IntegrityCursor>;
    if (parsed.check !== expectedCheck) return null;
    if (typeof parsed.primary !== "string" || !validIdentifier(parsed.primary)) return null;
    if (typeof parsed.secondary !== "string"
      || (parsed.secondary !== "" && !validIdentifier(parsed.secondary))) return null;
    return { check: expectedCheck, primary: parsed.primary, secondary: parsed.secondary };
  } catch {
    return null;
  }
}

function parseLimit(value: string | undefined, fallback: number): number | null {
  if (value === undefined || value === "") return fallback;
  if (!/^\d{1,3}$/.test(value)) return null;
  const limit = Number(value);
  return limit >= 1 && limit <= MAX_PAGE_SIZE ? limit : null;
}

function validIdentifier(value: string): boolean {
  return /^[A-Za-z0-9._:-]{1,160}$/.test(value);
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function activityView(row: ActivityRow) {
  return {
    id: row.id,
    type: row.event_type,
    occurredAt: row.occurred_at,
    severity: row.severity,
    outcome: row.outcome,
    organizationId: row.organization_id,
    userId: row.user_id,
    membershipId: row.membership_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    requestId: row.request_id,
    route: row.route,
    errorCode: row.error_code,
    organization: row.organization_id === null
      ? null
      : {
          id: row.organization_id,
          name: row.organization_name,
          domain: row.organization_domain,
        },
    actor: row.user_id === null
      ? null
      : {
          id: row.user_id,
          displayName: row.actor_display_name,
          email: row.actor_email,
        },
  };
}

function integrityIssueView(row: IntegrityIssueRow) {
  const references = [
    [row.reference_1_type, row.reference_1_id],
    [row.reference_2_type, row.reference_2_id],
    [row.reference_3_type, row.reference_3_id],
  ].flatMap(([type, id]) => type !== null && id !== null ? [{ type, id }] : []);
  return {
    issueKind: row.issue_kind,
    organizationId: row.organization_id,
    references,
    occurrences: Number(row.occurrences),
  };
}

function paginatedIntegrityQuery(issueSelect: string): string {
  return `
    WITH issues AS (
      ${issueSelect}
    )
    SELECT
      issue_kind, organization_id,
      reference_1_type, reference_1_id,
      reference_2_type, reference_2_id,
      reference_3_type, reference_3_id,
      occurrences, sort_primary, sort_secondary
    FROM issues
    WHERE ?1 IS NULL
      OR sort_primary > ?1
      OR (sort_primary = ?1 AND sort_secondary > ?2)
    ORDER BY sort_primary, sort_secondary
    LIMIT ?3
  `;
}

const INTEGRITY_ISSUE_QUERIES: Record<IntegrityCheckKey, string> = {
  tenant_without_member: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      tenant.id AS organization_id,
      'ORGANIZATION' AS reference_1_type,
      tenant.id AS reference_1_id,
      NULL AS reference_2_type,
      NULL AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      tenant.id AS sort_primary,
      '' AS sort_secondary
    FROM organization tenant
    WHERE tenant.kind = 'TENANT'
      AND NOT EXISTS (
        SELECT 1
        FROM membership
        WHERE membership.organization_id = tenant.id
      )
  `),
  spot_owner_tenant_mismatch: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      parking_spot.organization_id,
      'PARKING_SPOT' AS reference_1_type,
      parking_spot.id AS reference_1_id,
      'MEMBERSHIP' AS reference_2_type,
      parking_spot.owner_membership_id AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      parking_spot.id AS sort_primary,
      '' AS sort_secondary
    FROM parking_spot
    LEFT JOIN membership ON membership.id = parking_spot.owner_membership_id
    WHERE membership.id IS NULL
      OR membership.organization_id <> parking_spot.organization_id
  `),
  offer_spot_owner_mismatch: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      availability_offer.organization_id,
      'AVAILABILITY_OFFER' AS reference_1_type,
      availability_offer.id AS reference_1_id,
      'PARKING_SPOT' AS reference_2_type,
      availability_offer.parking_spot_id AS reference_2_id,
      'MEMBERSHIP' AS reference_3_type,
      availability_offer.owner_membership_id AS reference_3_id,
      1 AS occurrences,
      availability_offer.id AS sort_primary,
      '' AS sort_secondary
    FROM availability_offer
    LEFT JOIN parking_spot ON parking_spot.id = availability_offer.parking_spot_id
    LEFT JOIN membership ON membership.id = availability_offer.owner_membership_id
    WHERE parking_spot.id IS NULL
      OR membership.id IS NULL
      OR parking_spot.organization_id <> availability_offer.organization_id
      OR membership.organization_id <> availability_offer.organization_id
      OR parking_spot.owner_membership_id <> availability_offer.owner_membership_id
  `),
  reservation_offer_member_mismatch: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      reservation.organization_id,
      'RESERVATION' AS reference_1_type,
      reservation.id AS reference_1_id,
      'AVAILABILITY_OFFER' AS reference_2_type,
      reservation.availability_offer_id AS reference_2_id,
      'MEMBERSHIP' AS reference_3_type,
      reservation.reserver_membership_id AS reference_3_id,
      1 AS occurrences,
      reservation.id AS sort_primary,
      '' AS sort_secondary
    FROM reservation
    LEFT JOIN availability_offer ON availability_offer.id = reservation.availability_offer_id
    LEFT JOIN membership ON membership.id = reservation.reserver_membership_id
    WHERE availability_offer.id IS NULL
      OR membership.id IS NULL
      OR availability_offer.organization_id <> reservation.organization_id
      OR membership.organization_id <> reservation.organization_id
      OR availability_offer.owner_membership_id = reservation.reserver_membership_id
  `),
  active_offer_overlap: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      first_offer.organization_id,
      'AVAILABILITY_OFFER' AS reference_1_type,
      first_offer.id AS reference_1_id,
      'AVAILABILITY_OFFER' AS reference_2_type,
      second_offer.id AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      first_offer.id AS sort_primary,
      second_offer.id AS sort_secondary
    FROM availability_offer first_offer
    JOIN availability_offer second_offer
      ON second_offer.parking_spot_id = first_offer.parking_spot_id
      AND second_offer.id > first_offer.id
      AND second_offer.status = 'PUBLISHED'
      AND first_offer.starts_at < second_offer.ends_at
      AND first_offer.ends_at > second_offer.starts_at
    WHERE first_offer.status = 'PUBLISHED'
  `),
  multiple_confirmed_reservations: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      reservation.organization_id,
      'RESERVATION' AS reference_1_type,
      reservation.id AS reference_1_id,
      'AVAILABILITY_OFFER' AS reference_2_type,
      reservation.availability_offer_id AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      duplicates.occurrences,
      reservation.availability_offer_id AS sort_primary,
      reservation.id AS sort_secondary
    FROM reservation
    JOIN (
      SELECT availability_offer_id, COUNT(*) AS occurrences
      FROM reservation
      WHERE status = 'CONFIRMED'
      GROUP BY availability_offer_id
      HAVING COUNT(*) > 1
    ) duplicates ON duplicates.availability_offer_id = reservation.availability_offer_id
    WHERE reservation.status = 'CONFIRMED'
  `),
  system_organization_count: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      NULL AS organization_id,
      'ORGANIZATION' AS reference_1_type,
      system_organization.id AS reference_1_id,
      NULL AS reference_2_type,
      NULL AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      system_organization.id AS sort_primary,
      '' AS sort_secondary
    FROM organization system_organization
    WHERE system_organization.kind = 'SYSTEM'
      AND (
        SELECT CASE
          WHEN COUNT(*) = 1
            AND SUM(CASE
              WHEN id = 'org_system_parkventory'
                AND normalized_domain = 'system.parkventory.invalid'
              THEN 1 ELSE 0
            END) = 1
          THEN 0 ELSE 1
        END
        FROM organization
        WHERE kind = 'SYSTEM'
      ) = 1
    UNION ALL
    SELECT
      'MISSING' AS issue_kind,
      NULL AS organization_id,
      NULL AS reference_1_type,
      NULL AS reference_1_id,
      NULL AS reference_2_type,
      NULL AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      '__missing__' AS sort_primary,
      '' AS sort_secondary
    WHERE NOT EXISTS (
      SELECT 1 FROM organization WHERE kind = 'SYSTEM'
    )
  `),
  system_membership_invalid: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      NULL AS organization_id,
      'MEMBERSHIP' AS reference_1_type,
      membership.id AS reference_1_id,
      'ORGANIZATION' AS reference_2_type,
      membership.organization_id AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      (
        SELECT COUNT(*)
        FROM membership system_membership
        JOIN organization system_organization
          ON system_organization.id = system_membership.organization_id
        WHERE system_organization.kind = 'SYSTEM'
      ) AS occurrences,
      membership.id AS sort_primary,
      '' AS sort_secondary
    FROM membership
    JOIN organization ON organization.id = membership.organization_id
    WHERE organization.kind = 'SYSTEM'
      AND (
        membership.role <> 'ADMIN'
        OR (
          SELECT COUNT(*)
          FROM membership system_membership
          JOIN organization system_organization
            ON system_organization.id = system_membership.organization_id
          WHERE system_organization.kind = 'SYSTEM'
        ) > 1
      )
  `),
  system_business_data: paginatedIntegrityQuery(`
    SELECT
      'ROW' AS issue_kind,
      NULL AS organization_id,
      'PARKING_SPOT' AS reference_1_type,
      parking_spot.id AS reference_1_id,
      NULL AS reference_2_type,
      NULL AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      'PARKING_SPOT' AS sort_primary,
      parking_spot.id AS sort_secondary
    FROM parking_spot
    JOIN organization ON organization.id = parking_spot.organization_id
    WHERE organization.kind = 'SYSTEM'
    UNION ALL
    SELECT
      'ROW' AS issue_kind,
      NULL AS organization_id,
      'AVAILABILITY_OFFER' AS reference_1_type,
      availability_offer.id AS reference_1_id,
      NULL AS reference_2_type,
      NULL AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      'AVAILABILITY_OFFER' AS sort_primary,
      availability_offer.id AS sort_secondary
    FROM availability_offer
    JOIN organization ON organization.id = availability_offer.organization_id
    WHERE organization.kind = 'SYSTEM'
    UNION ALL
    SELECT
      'ROW' AS issue_kind,
      NULL AS organization_id,
      'RESERVATION' AS reference_1_type,
      reservation.id AS reference_1_id,
      NULL AS reference_2_type,
      NULL AS reference_2_id,
      NULL AS reference_3_type,
      NULL AS reference_3_id,
      1 AS occurrences,
      'RESERVATION' AS sort_primary,
      reservation.id AS sort_secondary
    FROM reservation
    JOIN organization ON organization.id = reservation.organization_id
    WHERE organization.kind = 'SYSTEM'
  `),
};

function numberValue(row: Record<string, unknown> | undefined, key: string): number {
  return Number(row?.[key] ?? 0);
}

function utcDay(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString().slice(0, 10);
}

export const requireGodmode: MiddlewareHandler<AppEnvironment> = async (context, next) => {
  const member = context.get("member");
  if (
    !member.godmode
    || member.organizationKind !== "SYSTEM"
    || member.organizationId !== SYSTEM_ORGANIZATION_ID
    || member.role !== "ADMIN"
  ) {
    await recordActivityEvent(context.env.DB, {
      eventType: "GODMODE_ACCESS_DENIED",
      occurredAt: nowSeconds(),
      severity: "WARNING",
      outcome: "DENIED",
      organizationId: member.organizationId,
      userId: member.userId,
      membershipId: member.membershipId,
      requestId: context.get("requestId"),
      route: "/api/v1/admin/*",
      errorCode: "GODMODE_FORBIDDEN",
      dedupeWindowSeconds: 5 * 60,
    }).catch(() => undefined);
    return problem(403, "Cet espace est réservé à l’opérateur Parkventory.");
  }

  await next();
};

export function registerAdminRoutes(app: Hono<AppEnvironment>): void {
  app.get("/api/v1/admin/overview", async (context) => {
    const now = nowSeconds();
    const todayStart = Math.floor(Date.parse(`${utcDay(now)}T00:00:00.000Z`) / 1000);
    const from = todayStart - ((OVERVIEW_DAYS - 1) * 24 * 60 * 60);

    const [totalsResult, periodResult, tenantSeries, userSeries, shareSeries, reservationSeries, incidentSeries] = await context.env.DB.batch([
      context.env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM organization WHERE kind = 'TENANT') AS tenants,
          (SELECT COUNT(DISTINCT membership.user_id)
            FROM membership
            JOIN organization ON organization.id = membership.organization_id
            WHERE organization.kind = 'TENANT') AS users,
          (SELECT COUNT(*) FROM parking_spot
            JOIN organization ON organization.id = parking_spot.organization_id
            WHERE organization.kind = 'TENANT') AS parking_spots,
          (SELECT COUNT(*) FROM availability_offer
            JOIN organization ON organization.id = availability_offer.organization_id
            WHERE organization.kind = 'TENANT') AS shares,
          (SELECT COUNT(*) FROM reservation
            JOIN organization ON organization.id = reservation.organization_id
            WHERE organization.kind = 'TENANT') AS reservations,
          (SELECT COUNT(*) FROM app_session
            JOIN membership ON membership.id = app_session.membership_id
            JOIN organization ON organization.id = membership.organization_id
            WHERE organization.kind = 'TENANT'
              AND app_session.revoked_at IS NULL
              AND app_session.expires_at > ?1) AS active_sessions
      `).bind(now),
      context.env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM organization
            WHERE kind = 'TENANT' AND created_at >= ?1) AS new_tenants,
          (SELECT COUNT(DISTINCT membership.user_id)
            FROM membership
            JOIN organization ON organization.id = membership.organization_id
            WHERE organization.kind = 'TENANT' AND membership.created_at >= ?1) AS new_users,
          (SELECT COUNT(*) FROM availability_offer
            JOIN organization ON organization.id = availability_offer.organization_id
            WHERE organization.kind = 'TENANT' AND availability_offer.created_at >= ?1) AS shares,
          (SELECT COUNT(*) FROM reservation
            JOIN organization ON organization.id = reservation.organization_id
            WHERE organization.kind = 'TENANT' AND reservation.created_at >= ?1) AS reservations,
          (SELECT COUNT(*) FROM activity_event
            WHERE severity = 'ERROR' AND occurred_at >= ?1) AS incidents,
          (SELECT COUNT(DISTINCT activity_event.user_id)
            FROM activity_event
            JOIN organization ON organization.id = activity_event.organization_id
            WHERE organization.kind = 'TENANT'
              AND activity_event.user_id IS NOT NULL
              AND activity_event.occurred_at >= ?1) AS active_users_30d,
          (SELECT COUNT(DISTINCT activity_event.user_id)
            FROM activity_event
            JOIN organization ON organization.id = activity_event.organization_id
            WHERE organization.kind = 'TENANT'
              AND activity_event.user_id IS NOT NULL
              AND activity_event.occurred_at >= ?2) AS active_users_7d,
          (SELECT COUNT(*) FROM activity_event
            JOIN organization ON organization.id = activity_event.organization_id
            WHERE organization.kind = 'TENANT'
              AND activity_event.event_type = 'SHARE_WITHDRAWN'
              AND activity_event.occurred_at >= ?1) AS withdrawals,
          (SELECT COUNT(*) FROM activity_event
            JOIN organization ON organization.id = activity_event.organization_id
            WHERE organization.kind = 'TENANT'
              AND activity_event.event_type = 'RESERVATION_CANCELLED'
              AND activity_event.occurred_at >= ?1) AS cancellations
      `).bind(from, now - (7 * 24 * 60 * 60)),
      context.env.DB.prepare(`
        SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS count
        FROM organization
        WHERE kind = 'TENANT' AND created_at >= ?1
        GROUP BY day
      `).bind(from),
      context.env.DB.prepare(`
        SELECT date(membership.created_at, 'unixepoch') AS day,
          COUNT(DISTINCT membership.user_id) AS count
        FROM membership
        JOIN organization ON organization.id = membership.organization_id
        WHERE organization.kind = 'TENANT' AND membership.created_at >= ?1
        GROUP BY day
      `).bind(from),
      context.env.DB.prepare(`
        SELECT date(availability_offer.created_at, 'unixepoch') AS day, COUNT(*) AS count
        FROM availability_offer
        JOIN organization ON organization.id = availability_offer.organization_id
        WHERE organization.kind = 'TENANT' AND availability_offer.created_at >= ?1
        GROUP BY day
      `).bind(from),
      context.env.DB.prepare(`
        SELECT date(reservation.created_at, 'unixepoch') AS day, COUNT(*) AS count
        FROM reservation
        JOIN organization ON organization.id = reservation.organization_id
        WHERE organization.kind = 'TENANT' AND reservation.created_at >= ?1
        GROUP BY day
      `).bind(from),
      context.env.DB.prepare(`
        SELECT date(occurred_at, 'unixepoch') AS day, COUNT(*) AS count
        FROM activity_event
        WHERE severity = 'ERROR' AND occurred_at >= ?1
        GROUP BY day
      `).bind(from),
    ]);

    const totals = totalsResult.results[0] as Record<string, unknown> | undefined;
    const period = periodResult.results[0] as Record<string, unknown> | undefined;
    const series = new Map<string, {
      date: string;
      newTenants: number;
      newUsers: number;
      shares: number;
      reservations: number;
      incidents: number;
    }>();
    for (let index = 0; index < OVERVIEW_DAYS; index += 1) {
      const day = utcDay(from + (index * 24 * 60 * 60));
      series.set(day, { date: day, newTenants: 0, newUsers: 0, shares: 0, reservations: 0, incidents: 0 });
    }
    const mergeSeries = (rows: unknown[], key: "newTenants" | "newUsers" | "shares" | "reservations" | "incidents") => {
      for (const row of rows as Array<{ day: string; count: number }>) {
        const target = series.get(row.day);
        if (target) target[key] = Number(row.count ?? 0);
      }
    };
    mergeSeries(tenantSeries.results, "newTenants");
    mergeSeries(userSeries.results, "newUsers");
    mergeSeries(shareSeries.results, "shares");
    mergeSeries(reservationSeries.results, "reservations");
    mergeSeries(incidentSeries.results, "incidents");

    return context.json({
      generatedAt: now,
      window: { days: OVERVIEW_DAYS, from, to: now, timeZone: "UTC" as const },
      totals: {
        tenants: numberValue(totals, "tenants"),
        users: numberValue(totals, "users"),
        parkingSpots: numberValue(totals, "parking_spots"),
        shares: numberValue(totals, "shares"),
        reservations: numberValue(totals, "reservations"),
        activeSessions: numberValue(totals, "active_sessions"),
      },
      period: {
        newTenants: numberValue(period, "new_tenants"),
        newUsers: numberValue(period, "new_users"),
        shares: numberValue(period, "shares"),
        reservations: numberValue(period, "reservations"),
        incidents: numberValue(period, "incidents"),
        activeUsers7d: numberValue(period, "active_users_7d"),
        activeUsers30d: numberValue(period, "active_users_30d"),
        withdrawals: numberValue(period, "withdrawals"),
        cancellations: numberValue(period, "cancellations"),
        reservationRate: numberValue(period, "shares") === 0
          ? null
          : Number((numberValue(period, "reservations") / numberValue(period, "shares")).toFixed(4)),
      },
      series: Array.from(series.values()),
    });
  });

  app.get("/api/v1/admin/tenants", async (context) => {
    const limit = parseLimit(context.req.query("limit"), DEFAULT_PAGE_SIZE);
    const cursorValue = context.req.query("cursor");
    const cursor = decodeCursor(cursorValue);
    const query = (context.req.query("q") ?? "").trim();
    if (limit === null || (cursorValue && !cursor) || query.length > 100 || /[\u0000-\u001f]/.test(query)) {
      return problem(400, "Les paramètres de pagination ou de recherche ne sont pas valides.");
    }

    const clauses = ["organization.kind = 'TENANT'"];
    const bindings: unknown[] = [];
    if (query) {
      bindings.push(`%${escapeLike(query.toLowerCase())}%`);
      clauses.push(`(
        lower(organization.display_name) LIKE ?${bindings.length} ESCAPE '\\'
        OR organization.normalized_domain LIKE ?${bindings.length} ESCAPE '\\'
      )`);
    }
    if (cursor) {
      bindings.push(cursor.at, cursor.id);
      clauses.push(`(
        organization.created_at < ?${bindings.length - 1}
        OR (organization.created_at = ?${bindings.length - 1} AND organization.id < ?${bindings.length})
      )`);
    }
    bindings.push(limit + 1);

    const result = await context.env.DB.prepare(`
      SELECT
        organization.id,
        organization.normalized_domain,
        organization.display_name,
        organization.created_at,
        COALESCE(branding.enabled, 0) AS branding_enabled,
        (SELECT COUNT(*) FROM membership
          WHERE membership.organization_id = organization.id) AS member_count,
        (SELECT COUNT(*) FROM parking_spot
          WHERE parking_spot.organization_id = organization.id) AS spot_count,
        (SELECT COUNT(*) FROM availability_offer
          WHERE availability_offer.organization_id = organization.id) AS share_count,
        (SELECT COUNT(*) FROM reservation
          WHERE reservation.organization_id = organization.id) AS reservation_count,
        (SELECT COUNT(*) FROM app_session
          JOIN membership session_membership ON session_membership.id = app_session.membership_id
          WHERE session_membership.organization_id = organization.id
            AND app_session.revoked_at IS NULL
            AND app_session.expires_at > unixepoch()) AS active_session_count,
        (SELECT MAX(activity_event.occurred_at) FROM activity_event
          WHERE activity_event.organization_id = organization.id) AS last_activity_at
      FROM organization
      LEFT JOIN organization_branding branding
        ON branding.normalized_domain = organization.normalized_domain
      WHERE ${clauses.join(" AND ")}
      ORDER BY organization.created_at DESC, organization.id DESC
      LIMIT ?${bindings.length}
    `).bind(...bindings).all<Record<string, unknown>>();

    const hasMore = result.results.length > limit;
    const rows = result.results.slice(0, limit);
    const items = rows.map((row) => ({
      id: String(row.id),
      domain: String(row.normalized_domain),
      name: String(row.display_name),
      createdAt: Number(row.created_at),
      memberCount: Number(row.member_count ?? 0),
      spotCount: Number(row.spot_count ?? 0),
      shareCount: Number(row.share_count ?? 0),
      reservationCount: Number(row.reservation_count ?? 0),
      activeSessionCount: Number(row.active_session_count ?? 0),
      lastActivityAt: row.last_activity_at === null ? null : Number(row.last_activity_at),
      brandingEnabled: Number(row.branding_enabled) === 1,
    }));
    const last = rows.at(-1);
    return context.json({
      items,
      page: {
        nextCursor: hasMore && last
          ? encodeCursor({ at: Number(last.created_at), id: String(last.id) })
          : null,
      },
    });
  });

  app.get("/api/v1/admin/tenants/:id", async (context) => {
    const tenantId = context.req.param("id");
    if (!validIdentifier(tenantId)) return problem(400, "L’identifiant du tenant n’est pas valide.");

    const [tenantResult, statsResult, activityResult, membersResult, spotsResult] = await context.env.DB.batch([
      context.env.DB.prepare(`
        SELECT
          organization.id,
          organization.normalized_domain,
          organization.display_name,
          organization.created_at,
          branding.enabled AS branding_enabled,
          branding.company_name AS branding_company_name,
          branding.logo_url AS branding_logo_url
        FROM organization
        LEFT JOIN organization_branding branding
          ON branding.normalized_domain = organization.normalized_domain
        WHERE organization.id = ?1 AND organization.kind = 'TENANT'
      `).bind(tenantId),
      context.env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM membership WHERE organization_id = ?1) AS users,
          (SELECT COUNT(*) FROM parking_spot WHERE organization_id = ?1) AS parking_spots,
          (SELECT COUNT(*) FROM availability_offer WHERE organization_id = ?1) AS shares,
          (SELECT COUNT(*) FROM reservation WHERE organization_id = ?1) AS reservations,
          (SELECT COUNT(*) FROM app_session
            JOIN membership ON membership.id = app_session.membership_id
            WHERE membership.organization_id = ?1
              AND app_session.revoked_at IS NULL
              AND app_session.expires_at > unixepoch()) AS active_sessions
      `).bind(tenantId),
      context.env.DB.prepare(`
        SELECT
          event.id, event.event_type, event.occurred_at, event.severity, event.outcome,
          event.organization_id, event.user_id, event.membership_id,
          event.entity_type, event.entity_id, event.request_id, event.route, event.error_code,
          event_organization.display_name AS organization_name,
          event_organization.normalized_domain AS organization_domain,
          actor.display_name AS actor_display_name,
          actor.normalized_email AS actor_email
        FROM activity_event event
        LEFT JOIN organization event_organization ON event_organization.id = event.organization_id
        LEFT JOIN user_account actor ON actor.id = event.user_id
        WHERE event.organization_id = ?1
        ORDER BY event.occurred_at DESC, event.id DESC
        LIMIT 20
      `).bind(tenantId),
      context.env.DB.prepare(`
        SELECT
          membership.id AS membership_id,
          membership.role,
          membership.created_at,
          user_account.id AS user_id,
          user_account.display_name,
          user_account.normalized_email,
          (SELECT COUNT(*) FROM app_session
            WHERE app_session.membership_id = membership.id
              AND app_session.revoked_at IS NULL
              AND app_session.expires_at > unixepoch()) AS active_sessions,
          (SELECT MAX(activity_event.occurred_at) FROM activity_event
            WHERE activity_event.membership_id = membership.id) AS last_activity_at
        FROM membership
        JOIN user_account ON user_account.id = membership.user_id
        WHERE membership.organization_id = ?1
        ORDER BY membership.created_at DESC, membership.id DESC
        LIMIT 20
      `).bind(tenantId),
      context.env.DB.prepare(`
        SELECT
          parking_spot.id,
          parking_spot.label,
          parking_spot.level,
          parking_spot.time_zone,
          parking_spot.created_at,
          membership.id AS owner_membership_id,
          user_account.id AS owner_user_id,
          user_account.display_name AS owner_display_name,
          user_account.normalized_email AS owner_email,
          (SELECT COUNT(*) FROM availability_offer
            WHERE availability_offer.parking_spot_id = parking_spot.id) AS shares,
          (SELECT COUNT(*) FROM reservation
            JOIN availability_offer ON availability_offer.id = reservation.availability_offer_id
            WHERE availability_offer.parking_spot_id = parking_spot.id) AS reservations
        FROM parking_spot
        JOIN membership ON membership.id = parking_spot.owner_membership_id
        JOIN user_account ON user_account.id = membership.user_id
        WHERE parking_spot.organization_id = ?1
        ORDER BY parking_spot.created_at DESC, parking_spot.id DESC
        LIMIT 20
      `).bind(tenantId),
    ]);

    const tenant = tenantResult.results[0] as Record<string, unknown> | undefined;
    if (!tenant) return problem(404, "Ce tenant n’existe pas.");
    const stats = statsResult.results[0] as Record<string, unknown> | undefined;
    return context.json({
      tenant: {
        id: String(tenant.id),
        domain: String(tenant.normalized_domain),
        name: String(tenant.display_name),
        createdAt: Number(tenant.created_at),
        branding: tenant.branding_enabled === null
          ? null
          : {
              enabled: Number(tenant.branding_enabled) === 1,
              companyName: String(tenant.branding_company_name),
              logoUrl: String(tenant.branding_logo_url),
            },
      },
      stats: {
        users: numberValue(stats, "users"),
        parkingSpots: numberValue(stats, "parking_spots"),
        shares: numberValue(stats, "shares"),
        reservations: numberValue(stats, "reservations"),
        activeSessions: numberValue(stats, "active_sessions"),
      },
      recentActivity: (activityResult.results as unknown as ActivityRow[]).map(activityView),
      recentMembers: membersResult.results.map((row) => {
        const member = row as Record<string, unknown>;
        return {
          membershipId: String(member.membership_id),
          userId: String(member.user_id),
          displayName: String(member.display_name),
          email: String(member.normalized_email),
          role: String(member.role),
          createdAt: Number(member.created_at),
          activeSessions: Number(member.active_sessions ?? 0),
          lastActivityAt: member.last_activity_at === null ? null : Number(member.last_activity_at),
        };
      }),
      recentSpots: spotsResult.results.map((row) => {
        const spot = row as Record<string, unknown>;
        return {
          id: String(spot.id),
          label: String(spot.label),
          level: String(spot.level),
          timeZone: String(spot.time_zone),
          createdAt: Number(spot.created_at),
          owner: {
            membershipId: String(spot.owner_membership_id),
            userId: String(spot.owner_user_id),
            displayName: String(spot.owner_display_name),
            email: String(spot.owner_email),
          },
          shares: Number(spot.shares ?? 0),
          reservations: Number(spot.reservations ?? 0),
        };
      }),
      links: {
        users: `/api/v1/admin/users?tenantId=${encodeURIComponent(tenantId)}`,
        activity: `/api/v1/admin/activity?tenantId=${encodeURIComponent(tenantId)}`,
      },
    });
  });

  app.get("/api/v1/admin/users", async (context) => {
    const limit = parseLimit(context.req.query("limit"), DEFAULT_PAGE_SIZE);
    const cursorValue = context.req.query("cursor");
    const cursor = decodeCursor(cursorValue);
    const query = (context.req.query("q") ?? "").trim();
    const tenantId = (context.req.query("tenantId") ?? "").trim();
    if (
      limit === null
      || (cursorValue && !cursor)
      || query.length > 100
      || /[\u0000-\u001f]/.test(query)
      || (tenantId && !validIdentifier(tenantId))
    ) return problem(400, "Les filtres utilisateurs ne sont pas valides.");

    const clauses = ["organization.kind = 'TENANT'"];
    const bindings: unknown[] = [];
    if (query) {
      bindings.push(`%${escapeLike(query.toLowerCase())}%`);
      clauses.push(`(
        user_account.normalized_email LIKE ?${bindings.length} ESCAPE '\\'
        OR lower(user_account.display_name) LIKE ?${bindings.length} ESCAPE '\\'
      )`);
    }
    if (tenantId) {
      bindings.push(tenantId);
      clauses.push(`membership.organization_id = ?${bindings.length}`);
    }
    if (cursor) {
      bindings.push(cursor.at, cursor.id);
      clauses.push(`(
        user_account.created_at < ?${bindings.length - 1}
        OR (user_account.created_at = ?${bindings.length - 1} AND membership.id < ?${bindings.length})
      )`);
    }
    bindings.push(limit + 1);

    const result = await context.env.DB.prepare(`
      SELECT
        user_account.id,
        user_account.normalized_email,
        user_account.display_name,
        user_account.created_at,
        membership.id AS membership_id,
        membership.role,
        organization.id AS organization_id,
        organization.display_name AS organization_name,
        organization.normalized_domain AS organization_domain,
        parking_spot.id AS spot_id,
        parking_spot.label AS spot_label,
        parking_spot.level AS spot_level,
        (SELECT COUNT(*) FROM app_session
          WHERE app_session.membership_id = membership.id
            AND app_session.revoked_at IS NULL
            AND app_session.expires_at > unixepoch()) AS active_sessions,
        (SELECT MAX(app_session.created_at) FROM app_session
          WHERE app_session.membership_id = membership.id) AS last_session_at,
        (SELECT MAX(activity_event.occurred_at) FROM activity_event
          WHERE activity_event.membership_id = membership.id) AS last_activity_at,
        (SELECT COUNT(*) FROM availability_offer
          WHERE availability_offer.owner_membership_id = membership.id) AS shares,
        (SELECT COUNT(*) FROM reservation
          WHERE reservation.reserver_membership_id = membership.id) AS reservations
      FROM membership
      JOIN organization ON organization.id = membership.organization_id
      JOIN user_account ON user_account.id = membership.user_id
      LEFT JOIN parking_spot ON parking_spot.owner_membership_id = membership.id
      WHERE ${clauses.join(" AND ")}
      ORDER BY user_account.created_at DESC, membership.id DESC
      LIMIT ?${bindings.length}
    `).bind(...bindings).all<Record<string, unknown>>();

    const hasMore = result.results.length > limit;
    const rows = result.results.slice(0, limit);
    const items = rows.map((row) => ({
      id: String(row.id),
      email: String(row.normalized_email),
      displayName: String(row.display_name),
      createdAt: Number(row.created_at),
      membershipId: String(row.membership_id),
      role: String(row.role),
      tenant: {
        id: String(row.organization_id),
        name: String(row.organization_name),
        domain: String(row.organization_domain),
      },
      spot: row.spot_id === null
        ? null
        : { id: String(row.spot_id), label: String(row.spot_label), level: String(row.spot_level) },
      activeSessions: Number(row.active_sessions ?? 0),
      lastSessionAt: row.last_session_at === null ? null : Number(row.last_session_at),
      lastActivityAt: row.last_activity_at === null ? null : Number(row.last_activity_at),
      shares: Number(row.shares ?? 0),
      reservations: Number(row.reservations ?? 0),
    }));
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

  app.get("/api/v1/admin/activity", async (context) => {
    const limit = parseLimit(context.req.query("limit"), DEFAULT_ACTIVITY_PAGE_SIZE);
    const cursorValue = context.req.query("cursor");
    const cursor = decodeCursor(cursorValue);
    const tenantId = (context.req.query("tenantId") ?? "").trim();
    const userId = (context.req.query("userId") ?? "").trim();
    const type = (context.req.query("type") ?? "").trim();
    const severity = (context.req.query("severity") ?? "").trim();
    const errorCode = (context.req.query("errorCode") ?? "").trim();
    const reference = (context.req.query("reference") ?? "").trim();
    if (
      limit === null
      || (cursorValue && !cursor)
      || (tenantId && !validIdentifier(tenantId))
      || (userId && !validIdentifier(userId))
      || (type && !/^[A-Z][A-Z0-9_]{2,79}$/.test(type))
      || (severity && !["INFO", "WARNING", "ERROR"].includes(severity))
      || (errorCode && !/^[A-Z][A-Z0-9_]{1,79}$/.test(errorCode))
      || (reference && !validIdentifier(reference))
    ) return problem(400, "Les filtres d’activité ne sont pas valides.");

    const clauses = ["1 = 1"];
    const bindings: unknown[] = [];
    const addFilter = (column: string, value: string) => {
      if (!value) return;
      bindings.push(value);
      clauses.push(`${column} = ?${bindings.length}`);
    };
    addFilter("event.organization_id", tenantId);
    addFilter("event.user_id", userId);
    addFilter("event.event_type", type);
    addFilter("event.severity", severity);
    addFilter("event.error_code", errorCode);
    if (reference) {
      bindings.push(reference);
      clauses.push(`(
        event.id = ?${bindings.length}
        OR event.entity_id = ?${bindings.length}
        OR event.request_id = ?${bindings.length}
      )`);
    }
    if (cursor) {
      bindings.push(cursor.at, cursor.id);
      clauses.push(`(
        event.occurred_at < ?${bindings.length - 1}
        OR (event.occurred_at = ?${bindings.length - 1} AND event.id < ?${bindings.length})
      )`);
    }
    bindings.push(limit + 1);

    const result = await context.env.DB.prepare(`
      SELECT
        event.id, event.event_type, event.occurred_at, event.severity, event.outcome,
        event.organization_id, event.user_id, event.membership_id,
        event.entity_type, event.entity_id, event.request_id, event.route, event.error_code,
        event_organization.display_name AS organization_name,
        event_organization.normalized_domain AS organization_domain,
        actor.display_name AS actor_display_name,
        actor.normalized_email AS actor_email
      FROM activity_event event
      LEFT JOIN organization event_organization ON event_organization.id = event.organization_id
      LEFT JOIN user_account actor ON actor.id = event.user_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY event.occurred_at DESC, event.id DESC
      LIMIT ?${bindings.length}
    `).bind(...bindings).all<ActivityRow>();

    const hasMore = result.results.length > limit;
    const rows = result.results.slice(0, limit);
    const last = rows.at(-1);
    return context.json({
      items: rows.map(activityView),
      page: {
        nextCursor: hasMore && last
          ? encodeCursor({ at: last.occurred_at, id: last.id })
          : null,
      },
    });
  });

  app.get("/api/v1/admin/diagnostics/integrity", async (context) => {
    const checkValue = (context.req.query("check") ?? "").trim();
    const limit = parseLimit(context.req.query("limit"), DEFAULT_INTEGRITY_PAGE_SIZE);
    const cursorValue = context.req.query("cursor");
    if (!isIntegrityCheckKey(checkValue) || limit === null) {
      return problem(400, "Le contrôle d’intégrité demandé n’est pas valide.");
    }
    const cursor = cursorValue === undefined
      ? null
      : decodeIntegrityCursor(cursorValue, checkValue);
    if (cursorValue !== undefined && cursor === null) {
      return problem(400, "Le curseur du contrôle d’intégrité n’est pas valide.");
    }

    const result = await context.env.DB.prepare(INTEGRITY_ISSUE_QUERIES[checkValue])
      .bind(cursor?.primary ?? null, cursor?.secondary ?? null, limit + 1)
      .all<IntegrityIssueRow>();
    const hasMore = result.results.length > limit;
    const rows = result.results.slice(0, limit);
    const last = rows.at(-1);

    return context.json({
      check: checkValue,
      items: rows.map(integrityIssueView),
      page: {
        nextCursor: hasMore && last
          ? encodeIntegrityCursor({
              check: checkValue,
              primary: last.sort_primary,
              secondary: last.sort_secondary,
            })
          : null,
      },
    });
  });

  app.get("/api/v1/admin/diagnostics", async (context) => {
    const now = nowSeconds();
    const dayAgo = now - (24 * 60 * 60);
    const weekAgo = now - (7 * 24 * 60 * 60);
    const [
      databaseResult,
      telemetryResult,
      authenticationResult,
      incidentsResult,
      latestResult,
      integrityResult,
    ] = await context.env.DB.batch([
      context.env.DB.prepare("SELECT 1 AS ready"),
      context.env.DB.prepare(`
        SELECT COUNT(*) AS events, MIN(occurred_at) AS oldest, MAX(occurred_at) AS latest
        FROM activity_event
      `),
      context.env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM magic_link_request
            WHERE consumed_at IS NULL AND expires_at >= ?1) AS pending_magic_links,
          (SELECT COUNT(*) FROM magic_link_request
            WHERE consumed_at IS NULL AND expires_at < ?1) AS expired_magic_links,
          (SELECT COUNT(*) FROM app_session
            JOIN membership ON membership.id = app_session.membership_id
            JOIN organization ON organization.id = membership.organization_id
            WHERE organization.kind = 'TENANT'
              AND app_session.revoked_at IS NULL AND app_session.expires_at > ?1) AS active_tenant_sessions,
          (SELECT COUNT(*) FROM app_session
            JOIN membership ON membership.id = app_session.membership_id
            JOIN organization ON organization.id = membership.organization_id
            WHERE organization.kind = 'SYSTEM'
              AND app_session.revoked_at IS NULL AND app_session.expires_at > ?1) AS active_system_sessions,
          (SELECT COUNT(*) FROM app_session WHERE revoked_at IS NOT NULL) AS revoked_sessions
      `).bind(now),
      context.env.DB.prepare(`
        SELECT
          SUM(CASE WHEN occurred_at >= ?1 THEN 1 ELSE 0 END) AS last_24_hours,
          SUM(CASE WHEN occurred_at >= ?2 THEN 1 ELSE 0 END) AS last_7_days
        FROM activity_event
        WHERE severity = 'ERROR'
      `).bind(dayAgo, weekAgo),
      context.env.DB.prepare(`
        SELECT id, occurred_at, route, error_code, request_id, entity_id
        FROM activity_event
        WHERE severity = 'ERROR' AND entity_type = 'INCIDENT'
        ORDER BY occurred_at DESC, id DESC
        LIMIT 10
      `),
      context.env.DB.prepare(`
        SELECT
          (SELECT COUNT(*)
            FROM organization tenant
            WHERE tenant.kind = 'TENANT'
              AND NOT EXISTS (
                SELECT 1 FROM membership WHERE membership.organization_id = tenant.id
              )) AS tenant_without_member,
          (SELECT COUNT(*)
            FROM parking_spot
            LEFT JOIN membership ON membership.id = parking_spot.owner_membership_id
            WHERE membership.id IS NULL
              OR membership.organization_id <> parking_spot.organization_id
          ) AS spot_owner_tenant_mismatch,
          (SELECT COUNT(*)
            FROM availability_offer
            LEFT JOIN parking_spot ON parking_spot.id = availability_offer.parking_spot_id
            LEFT JOIN membership ON membership.id = availability_offer.owner_membership_id
            WHERE parking_spot.id IS NULL
              OR membership.id IS NULL
              OR parking_spot.organization_id <> availability_offer.organization_id
              OR membership.organization_id <> availability_offer.organization_id
              OR parking_spot.owner_membership_id <> availability_offer.owner_membership_id
          ) AS offer_spot_owner_mismatch,
          (SELECT COUNT(*)
            FROM reservation
            LEFT JOIN availability_offer ON availability_offer.id = reservation.availability_offer_id
            LEFT JOIN membership ON membership.id = reservation.reserver_membership_id
            WHERE availability_offer.id IS NULL
              OR membership.id IS NULL
              OR availability_offer.organization_id <> reservation.organization_id
              OR membership.organization_id <> reservation.organization_id
              OR availability_offer.owner_membership_id = reservation.reserver_membership_id
          ) AS reservation_offer_member_mismatch,
          (SELECT COUNT(*)
            FROM availability_offer first_offer
            JOIN availability_offer second_offer
              ON second_offer.parking_spot_id = first_offer.parking_spot_id
              AND second_offer.id > first_offer.id
              AND second_offer.status = 'PUBLISHED'
              AND first_offer.starts_at < second_offer.ends_at
              AND first_offer.ends_at > second_offer.starts_at
            WHERE first_offer.status = 'PUBLISHED'
          ) AS active_offer_overlap,
          (SELECT COUNT(*)
            FROM (
              SELECT availability_offer_id
              FROM reservation
              WHERE status = 'CONFIRMED'
              GROUP BY availability_offer_id
              HAVING COUNT(*) > 1
            ) duplicates
          ) AS multiple_confirmed_reservations,
          (SELECT CASE
              WHEN COUNT(*) = 1
                AND SUM(CASE
                  WHEN id = 'org_system_parkventory'
                    AND normalized_domain = 'system.parkventory.invalid'
                  THEN 1 ELSE 0
                END) = 1
              THEN 0
              ELSE 1
            END
            FROM organization
            WHERE kind = 'SYSTEM'
          ) AS system_organization_count,
          COALESCE((
            SELECT
              SUM(CASE WHEN membership.role <> 'ADMIN' THEN 1 ELSE 0 END)
              + CASE WHEN COUNT(*) > 1 THEN COUNT(*) - 1 ELSE 0 END
            FROM membership
            JOIN organization ON organization.id = membership.organization_id
            WHERE organization.kind = 'SYSTEM'
          ), 0) AS system_membership_invalid,
          ((SELECT COUNT(*) FROM parking_spot
            JOIN organization ON organization.id = parking_spot.organization_id
            WHERE organization.kind = 'SYSTEM')
          + (SELECT COUNT(*) FROM availability_offer
            JOIN organization ON organization.id = availability_offer.organization_id
            WHERE organization.kind = 'SYSTEM')
          + (SELECT COUNT(*) FROM reservation
            JOIN organization ON organization.id = reservation.organization_id
            WHERE organization.kind = 'SYSTEM')) AS system_business_data
      `),
    ]);
    const database = databaseResult.results[0] as { ready?: number } | undefined;
    if (database?.ready !== 1) return problem(503, "La base de données n’est pas disponible.");
    const telemetry = telemetryResult.results[0] as Record<string, unknown> | undefined;
    const authentication = authenticationResult.results[0] as Record<string, unknown> | undefined;
    const incidents = incidentsResult.results[0] as Record<string, unknown> | undefined;
    const integrityDefinitions: Record<string, { label: string; severity: "WARNING" | "ERROR"; detail: string }> = {
      tenant_without_member: {
        label: "Tenants sans membre",
        severity: "WARNING",
        detail: "Chaque tenant issu d’une connexion vérifiée devrait contenir au moins un membre.",
      },
      spot_owner_tenant_mismatch: {
        label: "Places et propriétaires incohérents",
        severity: "ERROR",
        detail: "La place et son propriétaire doivent appartenir au même tenant.",
      },
      offer_spot_owner_mismatch: {
        label: "Partages et places incohérents",
        severity: "ERROR",
        detail: "Chaque partage doit référencer la place et le propriétaire de son tenant.",
      },
      reservation_offer_member_mismatch: {
        label: "Réservations inter-tenants ou invalides",
        severity: "ERROR",
        detail: "L’offre et le réservataire doivent appartenir au même tenant, sans auto-réservation.",
      },
      active_offer_overlap: {
        label: "Chevauchements de partages actifs",
        severity: "ERROR",
        detail: "Une place ne doit pas avoir deux créneaux publiés qui se chevauchent.",
      },
      multiple_confirmed_reservations: {
        label: "Réservations confirmées multiples",
        severity: "ERROR",
        detail: "Une offre ne doit avoir qu’une réservation confirmée.",
      },
      system_organization_count: {
        label: "Organisation système unique",
        severity: "ERROR",
        detail: "Il doit exister exactement une organisation SYSTEM avec son identité interne réservée.",
      },
      system_membership_invalid: {
        label: "Opérateur système unique",
        severity: "ERROR",
        detail: "L’organisation SYSTEM accepte au plus un membre, obligatoirement ADMIN.",
      },
      system_business_data: {
        label: "Données métier dans SYSTEM",
        severity: "ERROR",
        detail: "L’organisation SYSTEM ne doit contenir aucune place, offre ou réservation.",
      },
    };
    const integrity = integrityResult.results[0] as Record<string, unknown> | undefined;
    const checks = Object.entries(integrityDefinitions).map(([key, definition]) => {
      const count = numberValue(integrity, key);
      return {
        key,
        label: definition.label,
        severity: definition.severity,
        count,
        status: count === 0 ? "ok" as const : "attention" as const,
        detail: definition.detail,
      };
    });
    const issueCount = checks.reduce((total, check) => total + check.count, 0);

    return context.json({
      generatedAt: now,
      database: { status: "ok" as const },
      telemetry: {
        events: numberValue(telemetry, "events"),
        oldestEventAt: telemetry?.oldest === null ? null : Number(telemetry?.oldest),
        latestEventAt: telemetry?.latest === null ? null : Number(telemetry?.latest),
      },
      authentication: {
        pendingMagicLinks: numberValue(authentication, "pending_magic_links"),
        expiredMagicLinks: numberValue(authentication, "expired_magic_links"),
        activeTenantSessions: numberValue(authentication, "active_tenant_sessions"),
        activeSystemSessions: numberValue(authentication, "active_system_sessions"),
        revokedSessions: numberValue(authentication, "revoked_sessions"),
      },
      incidents: {
        last24Hours: numberValue(incidents, "last_24_hours"),
        last7Days: numberValue(incidents, "last_7_days"),
        latest: latestResult.results.map((row) => {
          const incident = row as Record<string, unknown>;
          return {
            id: String(incident.id),
            incidentId: incident.entity_id === null ? null : String(incident.entity_id),
            occurredAt: Number(incident.occurred_at),
            route: incident.route === null ? null : String(incident.route),
            errorCode: incident.error_code === null ? null : String(incident.error_code),
            requestId: incident.request_id === null ? null : String(incident.request_id),
          };
        }),
      },
      integrity: {
        status: issueCount === 0 ? "healthy" as const : "attention" as const,
        issueCount,
        checks,
      },
    });
  });
}
