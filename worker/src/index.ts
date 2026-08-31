import { Hono } from "hono";
import type { Context, MiddlewareHandler } from "hono";
import {
  registerAdminRoutes,
  requireGodmode,
  SYSTEM_ORGANIZATION_DOMAIN,
  SYSTEM_ORGANIZATION_ID,
} from "./admin";
import { recordActivityEvent } from "./activity";
import {
  loadOrganizationBranding,
  organizationBrandingFromRow,
} from "./branding";
import type { OrganizationBrandingRow } from "./branding";
import { addDays, displayName, frenchDate, initials, organizationName, parisDate, zonedDateTimeToEpoch } from "./domain";
import { magicLinkEmail } from "./email";
import {
  cookieValue,
  expiredSessionCookie,
  isGodmodeEmail,
  isSameOrigin,
  parseEmail,
  parseProfessionalEmail,
  randomToken,
  sessionCookie,
  sessionCookieName,
  sha256,
  verifyTurnstile,
} from "./security";
import type { AppEnvironment, AuthenticatedMember } from "./types";

const app = new Hono<AppEnvironment>();
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAGIC_LINK_TTL_SECONDS = 15 * 60;
const TIME_ZONE = "Europe/Paris";
const genericMagicLinkMessage = "Si cette adresse professionnelle est autorisée, un lien de connexion vient d’être envoyé.";
const EXACT_CLASSIFIED_ROUTES = new Set([
  "/api/v1/health",
  "/api/v1/auth/requests",
  "/api/v1/auth/verify",
  "/api/v1/auth/session",
  "/api/v1/dashboard",
  "/api/v1/spots",
  "/api/v1/shares",
  "/api/v1/admin/overview",
  "/api/v1/admin/tenants",
  "/api/v1/admin/users",
  "/api/v1/admin/activity",
  "/api/v1/admin/diagnostics",
  "/api/v1/admin/diagnostics/integrity",
]);

function problem(status: number, detail: string): Response {
  return Response.json({
    type: "about:blank",
    title: status >= 500 ? "Erreur du service" : "Requête refusée",
    status,
    detail,
  }, { status });
}

function accepted(message: string): Response {
  return Response.json({ accepted: true, message }, { status: 200 });
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function classifiedErrorType(error: unknown): "TypeError" | "Error" | "unknown" {
  if (error instanceof TypeError) return "TypeError";
  if (error instanceof Error) return "Error";
  return "unknown";
}

function isExpectedUniqueConstraint(error: unknown, columns: string): boolean {
  return error instanceof Error
    && error.message.includes(`UNIQUE constraint failed: ${columns}`);
}

async function classifiedErrorCode(error: unknown, secret: string): Promise<string> {
  const material = error instanceof Error
    ? `${error.name}\n${error.stack?.split("\n").slice(1, 8).map((frame) => frame.trim()).join("\n") ?? "no-stack"}`
    : typeof error;
  const fingerprint = await sha256(`${secret || "missing-app-secret"}:parkventory:error:${material}`);
  return `UNHANDLED_${fingerprint.slice(0, 16).toUpperCase()}`;
}

interface TenantConflictInput {
  code: string;
  detail: string;
  route: string;
  entityType?: "PARKING_SPOT" | "AVAILABILITY_OFFER" | "RESERVATION";
  entityId?: string;
}

async function tenantConflict(
  context: Context<AppEnvironment>,
  input: TenantConflictInput,
): Promise<Response> {
  const member = context.get("member");
  const entityId = input.entityId && /^[A-Za-z0-9][\w:-]{0,159}$/.test(input.entityId)
    ? input.entityId
    : null;
  await recordActivityEvent(context.env.DB, {
    eventType: "BUSINESS_RULE_REJECTED",
    occurredAt: nowSeconds(),
    severity: "WARNING",
    outcome: "DENIED",
    organizationId: member.organizationId,
    userId: member.userId,
    membershipId: member.membershipId,
    entityType: input.entityType ?? null,
    entityId,
    requestId: context.get("requestId"),
    route: input.route,
    errorCode: input.code,
    dedupeWindowSeconds: 5 * 60,
  }).catch(() => undefined);
  return problem(409, input.detail);
}

function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
}

function classifiedRoute(pathname: string): string {
  if (EXACT_CLASSIFIED_ROUTES.has(pathname)) return pathname;
  if (/^\/api\/v1\/admin\/tenants\/[^/]+$/.test(pathname)) return "/api/v1/admin/tenants/:id";
  if (/^\/api\/v1\/availability\/[^/]+\/reservations$/.test(pathname)) {
    return "/api/v1/availability/:id/reservations";
  }
  if (/^\/api\/v1\/reservations\/[^/]+$/.test(pathname)) return "/api/v1/reservations/:id";
  if (/^\/api\/v1\/availability\/[^/]+$/.test(pathname)) return "/api/v1/availability/:id";
  if (pathname.startsWith("/api/v1/admin/")) return "/api/v1/admin/*";
  if (pathname.startsWith("/api/")) return "/api/*";
  return "/*";
}

function publicOrigin(request: Request, configuredOrigin: string): string {
  const configured = configuredOrigin.trim().replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

function readBody<T>(request: Request): Promise<T | null> {
  return request.json<T>().catch(() => null);
}

app.use("/api/*", async (context, next) => {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  context.set("requestId", requestId);
  await next();
  context.header("X-Content-Type-Options", "nosniff");
  context.header("Referrer-Policy", "same-origin");
  context.header("Cache-Control", "no-store");
  context.header("X-Request-ID", requestId);
  console.log(JSON.stringify({
    event: "http_request",
    request_id: requestId,
    method: context.req.method,
    route: classifiedRoute(new URL(context.req.url).pathname),
    status: context.res.status,
    duration_ms: Date.now() - startedAt,
  }));
});

app.use("/api/*", async (context, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(context.req.method) && !isSameOrigin(context.req.raw)) {
    return problem(403, "Cette action doit provenir de Parkventory.");
  }
  await next();
});

const requireMember: MiddlewareHandler<AppEnvironment> = async (context, next) => {
  const cookieName = sessionCookieName(context.env.APP_ENV);
  const token = cookieValue(context.req.header("Cookie"), cookieName);
  if (!token) return problem(401, "Votre connexion a expiré. Reconnectez-vous pour continuer.");

  const tokenHash = await sha256(token);
  const member = await context.env.DB.prepare(`
    SELECT
      session.id AS session_id,
      membership.id AS membership_id,
      membership.organization_id,
      organization.kind AS organization_kind,
      organization.display_name AS organization_name,
      user_account.id AS user_id,
      user_account.normalized_email AS email,
      user_account.display_name,
      membership.role,
      branding.enabled AS branding_enabled,
      branding.company_name AS branding_company_name,
      branding.logo_url AS branding_logo_url,
      branding.action_fill AS branding_action_fill,
      branding.on_action AS branding_on_action,
      branding.available_fill AS branding_available_fill,
      branding.on_available AS branding_on_available,
      branding.highlight AS branding_highlight,
      branding.dark_action_ink AS branding_dark_action_ink,
      branding.dark_available_ink AS branding_dark_available_ink,
      branding.light_action_ink AS branding_light_action_ink,
      branding.light_available_ink AS branding_light_available_ink
    FROM app_session session
    JOIN membership ON membership.id = session.membership_id
    JOIN organization ON organization.id = membership.organization_id
    JOIN user_account ON user_account.id = membership.user_id
    LEFT JOIN organization_branding branding
      ON branding.normalized_domain = organization.normalized_domain
    WHERE session.token_hash = ?1
      AND session.revoked_at IS NULL
      AND session.expires_at > ?2
  `).bind(tokenHash, nowSeconds()).first<{
    session_id: string;
    membership_id: string;
    organization_id: string;
    organization_kind: "TENANT" | "SYSTEM";
    organization_name: string;
    user_id: string;
    email: string;
    display_name: string;
    role: "MEMBER" | "ADMIN";
  } & OrganizationBrandingRow>();

  if (!member) {
    context.header("Set-Cookie", expiredSessionCookie(context.env.APP_ENV));
    return problem(401, "Votre connexion a expiré. Reconnectez-vous pour continuer.");
  }

  const branding = organizationBrandingFromRow(member);
  const godmode = member.organization_kind === "SYSTEM"
    && member.organization_id === SYSTEM_ORGANIZATION_ID
    && member.role === "ADMIN"
    && await isGodmodeEmail(member.email, context.env.GODMODE_ADMIN_EMAIL_SHA256);
  context.set("member", {
    sessionId: member.session_id,
    membershipId: member.membership_id,
    organizationId: member.organization_id,
    organizationKind: member.organization_kind,
    organizationName: branding?.companyName ?? member.organization_name,
    userId: member.user_id,
    email: member.email,
    displayName: member.display_name,
    role: member.role,
    godmode,
    branding,
  });
  await next();
};

for (const route of [
  "/api/v1/auth/session",
  "/api/v1/dashboard",
  "/api/v1/spots",
  "/api/v1/shares",
  "/api/v1/availability/*",
  "/api/v1/reservations/*",
]) app.use(route, requireMember);

app.use("/api/v1/admin/*", requireMember);
app.use("/api/v1/admin/*", requireGodmode);

const requireTenantMember: MiddlewareHandler<AppEnvironment> = async (context, next) => {
  if (context.get("member").organizationKind !== "TENANT") {
    return problem(403, "Ce compte opérateur ne peut pas utiliser les routes d’un tenant.");
  }
  await next();
};

for (const route of [
  "/api/v1/dashboard",
  "/api/v1/spots",
  "/api/v1/shares",
  "/api/v1/availability/*",
  "/api/v1/reservations/*",
]) app.use(route, requireTenantMember);

registerAdminRoutes(app);

app.get("/api/v1/health", async (context) => {
  const row = await context.env.DB.prepare("SELECT 1 AS ready").first<{ ready: number }>();
  if (row?.ready !== 1) return problem(503, "La base de données n’est pas disponible.");
  return context.json({ status: "ok" });
});

app.post("/api/v1/auth/requests", async (context) => {
  const body = await readBody<{
    email?: unknown;
    turnstileToken?: unknown;
    purpose?: unknown;
  }>(context.req.raw);
  if (!body) return problem(400, "La requête n’est pas valide.");
  const purpose = body.purpose === undefined ? "tenant" : body.purpose;
  if (purpose !== "tenant" && purpose !== "admin") {
    return problem(400, "La requête n’est pas valide.");
  }

  const remoteIp = clientIp(context.req.raw);
  const challengePassed = await verifyTurnstile(
    context.env.TURNSTILE_SECRET_KEY,
    body.turnstileToken,
    remoteIp === "unknown" ? undefined : remoteIp,
  ).catch(() => false);
  if (!challengePassed) return problem(400, "La vérification de sécurité a échoué. Réessayez.");

  const candidate = parseEmail(body.email);
  const godmodeRequest = purpose === "admin" && candidate
    ? await isGodmodeEmail(candidate.email, context.env.GODMODE_ADMIN_EMAIL_SHA256)
    : false;
  const parsed = purpose === "admin"
    ? godmodeRequest
      ? { email: candidate!.email, domain: SYSTEM_ORGANIZATION_DOMAIN }
      : null
    : parseProfessionalEmail(body.email);
  const genericAdminResponse = () => Response.json(
    { accepted: true, message: genericMagicLinkMessage },
    { status: 202 },
  );
  if (!parsed) return genericAdminResponse();

  const issueMagicLink = async (): Promise<Response> => {
    if (!context.env.EMAIL) {
      return problem(503, "L’envoi des e-mails n’est pas encore activé.");
    }
    if (!context.env.APP_SECRET) {
      return problem(503, "Le service d’authentification n’est pas configuré.");
    }

    const now = nowSeconds();
    const ipHash = await sha256(`${context.env.APP_SECRET}:${remoteIp}`);
    const branding = await loadOrganizationBranding(context.env.DB, parsed.domain);
    const token = randomToken();
    const tokenHash = await sha256(token);
    const requestId = crypto.randomUUID();
    const insert = await context.env.DB.prepare(`
      INSERT INTO magic_link_request (
        id, token_hash, normalized_email, normalized_domain, requested_ip_hash,
        expires_at, created_at
      )
      SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7
      WHERE (
        SELECT COUNT(*)
        FROM magic_link_request
        WHERE normalized_email = ?3 AND created_at > ?8
      ) < 3
      AND (
        SELECT COUNT(*)
        FROM magic_link_request
        WHERE requested_ip_hash = ?5 AND created_at > ?8
      ) < 10
    `).bind(
      requestId,
      tokenHash,
      parsed.email,
      parsed.domain,
      ipHash,
      now + MAGIC_LINK_TTL_SECONDS,
      now,
      now - 3600,
    ).run();
    if ((insert.meta.changes ?? 0) < 1) {
      return new Response(JSON.stringify({
        type: "about:blank",
        title: "Trop de demandes",
        status: 429,
        detail: "Trop de liens ont été demandés. Réessayez dans une heure.",
      }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "3600" } });
    }

    const link = `${publicOrigin(context.req.raw, context.env.PUBLIC_ORIGIN)}/auth/callback#token=${encodeURIComponent(token)}`;
    const email = magicLinkEmail(link, branding?.colors);
    try {
      await context.env.EMAIL.send({
        to: parsed.email,
        from: context.env.EMAIL_FROM,
        ...email,
      });
    } catch (error) {
      await context.env.DB.prepare("DELETE FROM magic_link_request WHERE id = ?1").bind(requestId).run();
      console.error(JSON.stringify({
        event: "magic_link_send_failed",
        request_id: requestId,
        error_type: classifiedErrorType(error),
      }));
      return problem(503, "L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.");
    }

    return genericAdminResponse();
  };

  if (purpose === "admin") {
    context.executionCtx.waitUntil(
      Promise.resolve()
        .then(issueMagicLink)
        .then(() => undefined)
        .catch((error) => {
          console.error(JSON.stringify({
            event: "admin_magic_link_processing_failed",
            request_id: context.get("requestId"),
            error_type: classifiedErrorType(error),
          }));
        }),
    );
    return genericAdminResponse();
  }

  return issueMagicLink();
});

app.post("/api/v1/auth/verify", async (context) => {
  const body = await readBody<{ token?: unknown }>(context.req.raw);
  if (!body || typeof body.token !== "string" || body.token.length < 40 || body.token.length > 100) {
    return problem(400, "Ce lien de connexion n’est pas valide.");
  }

  const tokenHash = await sha256(body.token);
  const now = nowSeconds();
  const link = await context.env.DB.prepare(`
    SELECT id, normalized_email, normalized_domain, expires_at, consumed_at
    FROM magic_link_request
    WHERE token_hash = ?1
  `).bind(tokenHash).first<{
    id: string;
    normalized_email: string;
    normalized_domain: string;
    expires_at: number;
    consumed_at: number | null;
  }>();
  if (!link || link.consumed_at !== null || link.expires_at < now) {
    return problem(400, "Ce lien est expiré ou a déjà été utilisé.");
  }

  const godmode = link.normalized_domain === SYSTEM_ORGANIZATION_DOMAIN
    && await isGodmodeEmail(link.normalized_email, context.env.GODMODE_ADMIN_EMAIL_SHA256);
  if (link.normalized_domain === SYSTEM_ORGANIZATION_DOMAIN && !godmode) {
    return problem(400, "Ce lien est expiré ou a déjà été utilisé.");
  }

  const orgId = godmode
    ? SYSTEM_ORGANIZATION_ID
    : `org_${(await sha256(link.normalized_domain)).slice(0, 24)}`;
  const userId = `usr_${(await sha256(link.normalized_email)).slice(0, 24)}`;
  const membershipId = `mem_${(await sha256(`${orgId}:${userId}`)).slice(0, 24)}`;
  const sessionId = crypto.randomUUID();
  const sessionToken = randomToken();
  const sessionHash = await sha256(sessionToken);
  const name = displayName(link.normalized_email);
  const organizationStatement = godmode
    ? context.env.DB.prepare(`
        SELECT id
        FROM organization
        WHERE id = ?1 AND normalized_domain = ?2 AND kind = 'SYSTEM'
      `).bind(orgId, SYSTEM_ORGANIZATION_DOMAIN)
    : context.env.DB.prepare(`
        INSERT OR IGNORE INTO organization (
          id, normalized_domain, display_name, created_at, kind
        ) VALUES (?1, ?2, ?3, ?4, 'TENANT')
      `).bind(orgId, link.normalized_domain, organizationName(link.normalized_domain), now);
  const membershipRolePredicate = godmode
    ? "membership.role = 'ADMIN'"
    : "membership.role IN ('MEMBER', 'ADMIN')";

  try {
    await context.env.DB.batch([
      context.env.DB.prepare(`
        UPDATE magic_link_request SET consumed_at = ?1
        WHERE id = ?2 AND consumed_at IS NULL AND expires_at >= ?1
      `).bind(now, link.id),
      organizationStatement,
      context.env.DB.prepare(`
        INSERT OR IGNORE INTO user_account (id, normalized_email, display_name, created_at)
        VALUES (?1, ?2, ?3, ?4)
      `).bind(userId, link.normalized_email, name, now),
      context.env.DB.prepare(`
        INSERT OR IGNORE INTO membership (id, organization_id, user_id, role, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
      `).bind(membershipId, orgId, userId, godmode ? "ADMIN" : "MEMBER", now),
      context.env.DB.prepare(`
        INSERT INTO app_session (
          id, token_hash, magic_link_request_id, membership_id, expires_at, created_at
        ) VALUES (
          ?1,
          ?2,
          ?3,
          (
            SELECT membership.id
            FROM membership
            JOIN organization ON organization.id = membership.organization_id
            JOIN user_account ON user_account.id = membership.user_id
            WHERE membership.id = ?4
              AND membership.organization_id = ?7
              AND membership.user_id = ?8
              AND ${membershipRolePredicate}
              AND organization.kind = ?9
              AND organization.normalized_domain = ?10
              AND user_account.normalized_email = ?11
          ),
          ?5,
          ?6
        )
      `).bind(
        sessionId,
        sessionHash,
        link.id,
        membershipId,
        now + SESSION_TTL_SECONDS,
        now,
        orgId,
        userId,
        godmode ? "SYSTEM" : "TENANT",
        link.normalized_domain,
        link.normalized_email,
      ),
    ]);
  } catch {
    return problem(400, "Ce lien est expiré ou a déjà été utilisé.");
  }

  context.header("Set-Cookie", sessionCookie(sessionToken, context.env.APP_ENV));
  const branding = await loadOrganizationBranding(context.env.DB, link.normalized_domain);
  return context.json({
    authenticated: true,
    displayName: name,
    email: link.normalized_email,
    organizationName: godmode ? "Parkventory" : branding?.companyName ?? organizationName(link.normalized_domain),
    role: godmode ? "ADMIN" as const : "MEMBER" as const,
    godmode,
    branding,
  });
});

app.get("/api/v1/auth/session", (context) => {
  const member = context.get("member");
  return context.json({
    authenticated: true,
    displayName: member.displayName,
    email: member.email,
    organizationName: member.organizationName,
    role: member.role,
    godmode: member.godmode,
    branding: member.branding,
  });
});

app.delete("/api/v1/auth/session", async (context) => {
  const member = context.get("member");
  await context.env.DB.prepare("UPDATE app_session SET revoked_at = ?1 WHERE id = ?2")
    .bind(nowSeconds(), member.sessionId).run();
  context.header("Set-Cookie", expiredSessionCookie(context.env.APP_ENV));
  return context.json({ accepted: true, message: "Vous êtes déconnecté." });
});

interface SpotRow {
  id: string;
  label: string;
  level: string;
  time_zone: string;
}

interface OfferRow {
  id: string;
  owner_membership_id: string;
  local_date: string;
  local_from: string;
  local_to: string;
  time_zone: string;
  starts_at: number;
  label: string;
  level: string;
  reservation_id: string | null;
  reserver_membership_id: string | null;
}

function offerView(row: OfferRow, member: AuthenticatedMember) {
  const offered = row.owner_membership_id === member.membershipId;
  const reserved = row.reserver_membership_id === member.membershipId;
  return {
    id: row.id,
    dateLabel: frenchDate(row.local_date),
    timeLabel: `${row.local_from} – ${row.local_to}`,
    timeZone: row.time_zone,
    spot: row.label,
    level: row.level || "Niveau non renseigné",
    status: offered ? (row.reservation_id ? "RESERVED" : "UNAVAILABLE") : reserved ? "RESERVED" : "AVAILABLE",
    viewerRelation: offered ? "OFFERED" : reserved ? "RESERVED" : "NONE",
    reservationId: reserved ? row.reservation_id : null,
    canCancel: reserved && row.starts_at > nowSeconds(),
    canWithdraw: offered && !row.reservation_id && row.starts_at > nowSeconds(),
  };
}

app.get("/api/v1/dashboard", async (context) => {
  const member = context.get("member");
  const now = nowSeconds();
  const end = now + (8 * 24 * 60 * 60);
  const [spotResult, offersResult, statsResult] = await context.env.DB.batch([
    context.env.DB.prepare(`
      SELECT id, label, level, time_zone
      FROM parking_spot
      WHERE organization_id = ?1 AND owner_membership_id = ?2
    `).bind(member.organizationId, member.membershipId),
    context.env.DB.prepare(`
      SELECT
        offer.id,
        offer.owner_membership_id,
        offer.local_date,
        offer.local_from,
        offer.local_to,
        offer.time_zone,
        offer.starts_at,
        spot.label,
        spot.level,
        reservation.id AS reservation_id,
        reservation.reserver_membership_id
      FROM availability_offer offer
      JOIN parking_spot spot ON spot.id = offer.parking_spot_id
        AND spot.organization_id = offer.organization_id
      LEFT JOIN reservation ON reservation.availability_offer_id = offer.id
        AND reservation.status = 'CONFIRMED'
      WHERE offer.organization_id = ?1
        AND offer.status = 'PUBLISHED'
        AND offer.ends_at > ?2
        AND offer.starts_at < ?3
        AND (
          offer.owner_membership_id = ?4
          OR reservation.reserver_membership_id = ?4
          OR reservation.id IS NULL
        )
      ORDER BY offer.starts_at, spot.label
    `).bind(member.organizationId, now, end, member.membershipId),
    context.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM availability_offer WHERE organization_id = ?1) AS shared_total,
        (SELECT COUNT(*) FROM availability_offer
          WHERE organization_id = ?1 AND status = 'PUBLISHED' AND ends_at > ?2 AND starts_at < ?3) AS shares,
        (SELECT COUNT(*) FROM reservation r JOIN availability_offer o ON o.id = r.availability_offer_id
          WHERE r.organization_id = ?1 AND r.status = 'CONFIRMED' AND o.ends_at > ?2 AND o.starts_at < ?3) AS reservations,
        (SELECT COUNT(*) FROM availability_offer o
          WHERE o.organization_id = ?1 AND o.status = 'PUBLISHED' AND o.ends_at > ?2 AND o.starts_at < ?3
          AND NOT EXISTS (SELECT 1 FROM reservation r WHERE r.availability_offer_id = o.id AND r.status = 'CONFIRMED')) AS available_spots
    `).bind(member.organizationId, now, end),
  ]);

  const spot = (spotResult.results[0] as SpotRow | undefined) ?? null;
  const rows = offersResult.results as unknown as OfferRow[];
  const availability = rows.map((row) => offerView(row, member));
  const stats = (statsResult.results[0] as {
    shared_total?: number;
    shares?: number;
    reservations?: number;
    available_spots?: number;
  } | undefined) ?? {};
  const firstName = member.displayName.split(/\s+/)[0] || "membre";

  return context.json({
    user: {
      firstName,
      fullName: member.displayName,
      initials: initials(member.displayName),
      assignedSpot: spot?.label ?? null,
      assignedLevel: spot?.level || null,
      assignedSiteTimeZone: spot?.time_zone ?? null,
    },
    organization: {
      name: member.organizationName,
      sharedTotal: Number(stats.shared_total ?? 0),
    },
    branding: member.branding,
    stats: {
      shares: Number(stats.shares ?? 0),
      reservations: Number(stats.reservations ?? 0),
      availableSpots: Number(stats.available_spots ?? 0),
    },
    availability,
    activeShares: availability.filter((item) => item.viewerRelation === "OFFERED"),
  });
});

app.post("/api/v1/spots", async (context) => {
  const member = context.get("member");
  const body = await readBody<{ label?: unknown; level?: unknown }>(context.req.raw);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const level = typeof body?.level === "string" ? body.level.trim() : "";
  if (label.length < 1 || label.length > 40 || level.length > 40) {
    return problem(400, "Renseignez un libellé de place valide.");
  }
  try {
    await context.env.DB.prepare(`
      INSERT INTO parking_spot (
        id, organization_id, owner_membership_id, label, level, time_zone, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `).bind(
      crypto.randomUUID(),
      member.organizationId,
      member.membershipId,
      label,
      level,
      TIME_ZONE,
      nowSeconds(),
    ).run();
  } catch (error) {
    if (
      !isExpectedUniqueConstraint(error, "parking_spot.owner_membership_id")
      && !isExpectedUniqueConstraint(error, "parking_spot.organization_id, parking_spot.label")
    ) throw error;
    const existingSpot = await context.env.DB.prepare(`
      SELECT id
      FROM parking_spot
      WHERE organization_id = ?1
        AND (owner_membership_id = ?2 OR label = ?3)
      ORDER BY CASE WHEN owner_membership_id = ?2 THEN 0 ELSE 1 END, id
      LIMIT 1
    `).bind(member.organizationId, member.membershipId, label).first<{ id: string }>();
    return tenantConflict(context, {
      code: "SPOT_ALREADY_DECLARED",
      detail: "Cette place est déjà déclarée dans votre entreprise.",
      route: "/api/v1/spots",
      entityType: "PARKING_SPOT",
      entityId: existingSpot?.id,
    });
  }
  return accepted(`La place ${label} est prête à être partagée.`);
});

app.post("/api/v1/shares", async (context) => {
  const member = context.get("member");
  const body = await readBody<{ spot?: unknown; date?: unknown; from?: unknown; to?: unknown }>(context.req.raw);
  if (!body || typeof body.spot !== "string" || typeof body.date !== "string"
    || typeof body.from !== "string" || typeof body.to !== "string") {
    return problem(400, "Le créneau n’est pas valide.");
  }

  const today = parisDate(nowSeconds());
  if (body.date < today || body.date > addDays(today, 7)) {
    return problem(400, "Choisissez une date dans les 7 prochains jours.");
  }
  const startsAt = zonedDateTimeToEpoch(body.date, body.from, TIME_ZONE);
  const endsAt = zonedDateTimeToEpoch(body.date, body.to, TIME_ZONE);
  if (startsAt === null || endsAt === null || endsAt <= startsAt || startsAt <= nowSeconds()) {
    return problem(400, "Choisissez un créneau futur avec une fin postérieure au début.");
  }

  const spot = await context.env.DB.prepare(`
    SELECT id, label FROM parking_spot
    WHERE organization_id = ?1 AND owner_membership_id = ?2
  `).bind(member.organizationId, member.membershipId).first<{ id: string; label: string }>();
  if (!spot || spot.label !== body.spot) {
    return tenantConflict(context, {
      code: "SPOT_REQUIRED_FOR_SHARE",
      detail: "Déclarez votre place avant de la partager.",
      route: "/api/v1/shares",
      entityType: "PARKING_SPOT",
    });
  }

  try {
    await context.env.DB.prepare(`
      INSERT INTO availability_offer (
        id, organization_id, parking_spot_id, owner_membership_id,
        starts_at, ends_at, local_date, local_from, local_to, time_zone, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
    `).bind(
      crypto.randomUUID(), member.organizationId, spot.id, member.membershipId,
      startsAt, endsAt, body.date, body.from, body.to, TIME_ZONE, nowSeconds(),
    ).run();
  } catch (error) {
    if (String(error).includes("availability_overlap")) {
      return tenantConflict(context, {
        code: "SHARE_OVERLAP",
        detail: "Cette place est déjà partagée sur tout ou partie de ce créneau.",
        route: "/api/v1/shares",
        entityType: "PARKING_SPOT",
        entityId: spot.id,
      });
    }
    throw error;
  }
  return accepted(`La place ${spot.label} est partagée le`);
});

app.post("/api/v1/availability/:id/reservations", async (context) => {
  const member = context.get("member");
  const offerId = context.req.param("id");
  const idempotencyKey = context.req.header("Idempotency-Key")?.trim() ?? "";
  if (!/^[\w-]{16,100}$/.test(idempotencyKey)) {
    return problem(400, "La réservation n’a pas pu être confirmée. Réessayez.");
  }

  const existing = await context.env.DB.prepare(`
    SELECT id, availability_offer_id
    FROM reservation
    WHERE organization_id = ?1 AND reserver_membership_id = ?2 AND idempotency_key = ?3
  `).bind(member.organizationId, member.membershipId, idempotencyKey)
    .first<{ id: string; availability_offer_id: string }>();
  if (existing) {
    return existing.availability_offer_id === offerId
      ? accepted("La place est réservée.")
      : tenantConflict(context, {
          code: "RESERVATION_IDEMPOTENCY_CONFLICT",
          detail: "Cette tentative de réservation a déjà été utilisée.",
          route: "/api/v1/availability/:id/reservations",
          entityType: "AVAILABILITY_OFFER",
          entityId: existing.availability_offer_id,
        });
  }

  try {
    const result = await context.env.DB.prepare(`
      INSERT INTO reservation (
        id, organization_id, availability_offer_id, reserver_membership_id,
        idempotency_key, status, created_at
      )
      SELECT ?1, offer.organization_id, offer.id, ?2, ?3, 'CONFIRMED', ?4
      FROM availability_offer offer
      WHERE offer.id = ?5
        AND offer.organization_id = ?6
        AND offer.owner_membership_id <> ?2
        AND offer.status = 'PUBLISHED'
        AND offer.starts_at > ?4
        AND NOT EXISTS (
          SELECT 1 FROM reservation current
          WHERE current.availability_offer_id = offer.id AND current.status = 'CONFIRMED'
        )
    `).bind(
      crypto.randomUUID(), member.membershipId, idempotencyKey, nowSeconds(), offerId, member.organizationId,
    ).run();
    if ((result.meta.changes ?? 0) < 1) {
      const concurrentExisting = await context.env.DB.prepare(`
        SELECT id, availability_offer_id
        FROM reservation
        WHERE organization_id = ?1
          AND reserver_membership_id = ?2
          AND idempotency_key = ?3
      `).bind(member.organizationId, member.membershipId, idempotencyKey)
        .first<{ id: string; availability_offer_id: string }>();
      if (concurrentExisting) {
        return concurrentExisting.availability_offer_id === offerId
          ? accepted("La place est réservée.")
          : tenantConflict(context, {
              code: "RESERVATION_IDEMPOTENCY_CONFLICT",
              detail: "Cette tentative de réservation a déjà été utilisée.",
              route: "/api/v1/availability/:id/reservations",
              entityType: "AVAILABILITY_OFFER",
              entityId: concurrentExisting.availability_offer_id,
            });
      }
      return tenantConflict(context, {
        code: "RESERVATION_UNAVAILABLE",
        detail: "Cette place n’est plus disponible.",
        route: "/api/v1/availability/:id/reservations",
        entityType: "AVAILABILITY_OFFER",
      });
    }
  } catch (error) {
    if (isExpectedUniqueConstraint(
      error,
      "reservation.organization_id, reservation.reserver_membership_id, reservation.idempotency_key",
    )) {
      const concurrentExisting = await context.env.DB.prepare(`
        SELECT id, availability_offer_id
        FROM reservation
        WHERE organization_id = ?1
          AND reserver_membership_id = ?2
          AND idempotency_key = ?3
      `).bind(member.organizationId, member.membershipId, idempotencyKey)
        .first<{ id: string; availability_offer_id: string }>();
      if (!concurrentExisting) throw error;
      return concurrentExisting.availability_offer_id === offerId
        ? accepted("La place est réservée.")
        : tenantConflict(context, {
            code: "RESERVATION_IDEMPOTENCY_CONFLICT",
            detail: "Cette tentative de réservation a déjà été utilisée.",
            route: "/api/v1/availability/:id/reservations",
            entityType: "AVAILABILITY_OFFER",
            entityId: concurrentExisting.availability_offer_id,
          });
    }
    if (!isExpectedUniqueConstraint(error, "reservation.availability_offer_id")) throw error;
    const conflictingOffer = await context.env.DB.prepare(`
      SELECT availability_offer.id
      FROM availability_offer
      JOIN reservation
        ON reservation.availability_offer_id = availability_offer.id
        AND reservation.status = 'CONFIRMED'
      WHERE availability_offer.id = ?1
        AND availability_offer.organization_id = ?2
      LIMIT 1
    `).bind(offerId, member.organizationId).first<{ id: string }>();
    return tenantConflict(context, {
      code: "RESERVATION_WRITE_CONFLICT",
      detail: "Cette place vient d’être réservée par un collègue.",
      route: "/api/v1/availability/:id/reservations",
      entityType: "AVAILABILITY_OFFER",
      entityId: conflictingOffer?.id,
    });
  }
  return accepted("La place est réservée.");
});

app.delete("/api/v1/reservations/:id", async (context) => {
  const member = context.get("member");
  const result = await context.env.DB.prepare(`
    UPDATE reservation
    SET status = 'CANCELLED', cancelled_at = ?1
    WHERE id = ?2
      AND organization_id = ?3
      AND reserver_membership_id = ?4
      AND status = 'CONFIRMED'
      AND EXISTS (
        SELECT 1 FROM availability_offer offer
        WHERE offer.id = reservation.availability_offer_id
          AND offer.organization_id = reservation.organization_id
          AND offer.starts_at > ?1
      )
  `).bind(nowSeconds(), context.req.param("id"), member.organizationId, member.membershipId).run();
  if ((result.meta.changes ?? 0) < 1) {
    return tenantConflict(context, {
      code: "RESERVATION_CANCELLATION_REJECTED",
      detail: "Cette réservation ne peut plus être annulée.",
      route: "/api/v1/reservations/:id",
      entityType: "RESERVATION",
    });
  }
  return accepted("La réservation est annulée et la place redevient disponible.");
});

app.delete("/api/v1/availability/:id", async (context) => {
  const member = context.get("member");
  const now = nowSeconds();
  const result = await context.env.DB.prepare(`
    UPDATE availability_offer
    SET status = 'WITHDRAWN', withdrawn_at = ?1
    WHERE id = ?2
      AND organization_id = ?3
      AND owner_membership_id = ?4
      AND status = 'PUBLISHED'
      AND starts_at > ?1
      AND NOT EXISTS (
        SELECT 1 FROM reservation
        WHERE availability_offer_id = availability_offer.id AND status = 'CONFIRMED'
      )
  `).bind(now, context.req.param("id"), member.organizationId, member.membershipId).run();
  if ((result.meta.changes ?? 0) < 1) {
    return tenantConflict(context, {
      code: "SHARE_WITHDRAWAL_REJECTED",
      detail: "Une disponibilité réservée ou déjà commencée ne peut pas être retirée.",
      route: "/api/v1/availability/:id",
      entityType: "AVAILABILITY_OFFER",
    });
  }
  return accepted("La disponibilité est retirée.");
});

app.all("*", async (context) => {
  const url = new URL(context.req.url);
  if (url.hostname === "www.parkventory.com") {
    url.hostname = "parkventory.com";
    return Response.redirect(url.toString(), 308);
  }
  if (url.pathname.startsWith("/api/")) {
    return problem(404, "Cette route API n’existe pas.");
  }
  const response = await context.env.ASSETS.fetch(context.req.raw);
  if (["/admin", "/app", "/auth"].some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
});

app.notFound(() => problem(404, "Cette route n’existe pas."));

app.onError(async (error, context) => {
  const incidentId = crypto.randomUUID();
  const route = classifiedRoute(new URL(context.req.url).pathname);
  const errorCode = await classifiedErrorCode(error, context.env.APP_SECRET);
  const incidentMember = context.get("member") as AuthenticatedMember | undefined;
  await recordActivityEvent(context.env.DB, {
    eventType: "INCIDENT_RECORDED",
    occurredAt: nowSeconds(),
    severity: "ERROR",
    outcome: "FAILED",
    organizationId: incidentMember?.organizationId ?? null,
    userId: incidentMember?.userId ?? null,
    membershipId: incidentMember?.membershipId ?? null,
    entityType: "INCIDENT",
    entityId: incidentId,
    requestId: context.get("requestId") || incidentId,
    route,
    errorCode,
  }).catch(() => undefined);
  console.error(JSON.stringify({
    event: "unhandled_error",
    incident_id: incidentId,
    request_id: context.get("requestId") || incidentId,
    route,
    error_code: errorCode,
    error_type: classifiedErrorType(error),
  }));
  return problem(500, `Le service rencontre un problème. Référence : ${incidentId}`);
});

export default app;
