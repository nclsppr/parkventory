import {
  defaultLocale,
  isLocale,
  localeConfig,
  type Locale,
} from "../../../shared/i18n";
import { applicationMessages } from "../i18n/application";
import type {
  ActionResponse,
  AdminActivityData,
  AdminActivitySeverity,
  AdminDiagnosticsData,
  AdminIntegrityData,
  AdminOverviewData,
  AdminTenantDetailData,
  AdminTenantsData,
  AdminUsersData,
  DashboardData,
  SessionData,
  ShareRequest,
  SpotRequest,
  TenantAdminMembersData,
  TenantAdminOverviewData,
} from "../types";

const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function currentRequestLocale() {
  if (typeof document === "undefined") return defaultLocale;
  const language = document.documentElement.lang.split("-")[0].toLowerCase();
  return isLocale(language) ? language : defaultLocale;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const locale = currentRequestLocale();
  const copy = applicationMessages[locale].api;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Parkventory-Locale": locale,
  };
  if (Array.isArray(init?.headers)) {
    for (const [name, value] of init.headers) headers[name] = value;
  } else if (init?.headers instanceof Headers) {
    init.headers.forEach((value, name) => {
      headers[name] = value;
    });
  } else if (init?.headers) {
    Object.assign(headers, init.headers);
  }
  headers["X-Parkventory-Locale"] = locale;
  if (init?.body !== undefined && !Object.keys(headers).some((name) => name.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      credentials: "include",
      headers,
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(copy.timeout, 0);
    }
    throw new ApiError(copy.unreachable, 0);
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const serverDetail = problem && typeof problem.detail === "string" ? problem.detail : null;
    const incidentReference = response.status >= 500 && serverDetail
      ? serverDetail.match(/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i)?.[1]
      : undefined;
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfter = retryAfterHeader && /^\d+$/.test(retryAfterHeader)
      ? Number(retryAfterHeader)
      : undefined;
    let message = serverDetail ?? copy.actionFailed;
    if (response.status === 401 && !serverDetail) {
      message = copy.sessionExpired;
    } else if (response.status === 403 && !serverDetail) {
      message = copy.forbidden;
    } else if (response.status === 409 && !serverDetail) {
      message = copy.conflict;
    } else if (response.status === 429) {
      const formattedSeconds = retryAfter === undefined
        ? null
        : new Intl.NumberFormat(localeConfig[locale].intlLocale).format(retryAfter);
      message = retryAfter !== undefined
        ? copy.rateLimited(formattedSeconds ?? String(retryAfter))
        : copy.rateLimitedGeneric;
    } else if (response.status >= 500) {
      message = incidentReference
        ? copy.serviceProblemWithReference(incidentReference)
        : copy.serviceProblem;
    }
    throw new ApiError(message, response.status, retryAfter);
  }

  return response.json() as Promise<T>;
}

export function requestMagicLink(
  email: string,
  turnstileToken: string,
  purpose: "tenant" | "admin",
): Promise<ActionResponse> {
  return request<ActionResponse>("/auth/requests", {
    method: "POST",
    body: JSON.stringify({ email, turnstileToken, purpose }),
  });
}

export function verifyMagicLink(token: string): Promise<SessionData> {
  return request<SessionData>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function loadSession(): Promise<SessionData> {
  return request<SessionData>("/auth/session");
}

export function logout(): Promise<ActionResponse> {
  return request<ActionResponse>("/auth/session", { method: "DELETE" });
}

export function updateProfileLocale(locale: Locale): Promise<{ locale: Locale }> {
  return request<{ locale: Locale }>("/profile", {
    method: "PATCH",
    body: JSON.stringify({ locale }),
  });
}

export function loadDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/dashboard");
}

function queryPath(path: string, values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function loadAdminOverview(): Promise<AdminOverviewData> {
  return request<AdminOverviewData>("/admin/overview");
}

export function loadAdminTenants({
  limit = 25,
  cursor,
  q,
}: { limit?: number; cursor?: string; q?: string } = {}): Promise<AdminTenantsData> {
  return request<AdminTenantsData>(queryPath("/admin/tenants", { limit, cursor, q }));
}

export function loadAdminTenant(id: string): Promise<AdminTenantDetailData> {
  return request<AdminTenantDetailData>(`/admin/tenants/${encodeURIComponent(id)}`);
}

export function updateAdminTenantMemberRole(
  tenantId: string,
  membershipId: string,
  role: "MEMBER" | "ADMIN",
): Promise<ActionResponse & { role: "MEMBER" | "ADMIN" }> {
  return request<ActionResponse & { role: "MEMBER" | "ADMIN" }>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(membershipId)}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );
}

export function loadTenantAdminOverview(): Promise<TenantAdminOverviewData> {
  return request<TenantAdminOverviewData>("/tenant-admin/overview");
}

export function loadTenantAdminMembers({
  limit = 25,
  cursor,
  q,
}: { limit?: number; cursor?: string; q?: string } = {}): Promise<TenantAdminMembersData> {
  return request<TenantAdminMembersData>(queryPath("/tenant-admin/members", { limit, cursor, q }));
}

export function updateTenantAdminBranding(payload: {
  enabled: boolean;
  logoEnabled: boolean;
  actionColor: string;
  availableColor: string;
}): Promise<ActionResponse> {
  return request<ActionResponse>("/tenant-admin/branding", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function eraseTenantMemberEmail(membershipId: string): Promise<ActionResponse> {
  return request<ActionResponse>(`/tenant-admin/members/${encodeURIComponent(membershipId)}/email`, {
    method: "DELETE",
    body: JSON.stringify({ confirmation: "EFFACER" }),
  });
}

export function loadAdminUsers({
  limit = 25,
  cursor,
  q,
  tenantId,
}: {
  limit?: number;
  cursor?: string;
  q?: string;
  tenantId?: string;
} = {}): Promise<AdminUsersData> {
  return request<AdminUsersData>(queryPath("/admin/users", { limit, cursor, q, tenantId }));
}

export function loadAdminActivity({
  limit = 50,
  cursor,
  tenantId,
  userId,
  type,
  severity,
  errorCode,
  reference,
}: {
  limit?: number;
  cursor?: string;
  tenantId?: string;
  userId?: string;
  type?: string;
  severity?: AdminActivitySeverity;
  errorCode?: string;
  reference?: string;
} = {}): Promise<AdminActivityData> {
  return request<AdminActivityData>(queryPath("/admin/activity", {
    limit,
    cursor,
    tenantId,
    userId,
    type,
    severity,
    errorCode,
    reference,
  }));
}

export function loadAdminDiagnostics(): Promise<AdminDiagnosticsData> {
  return request<AdminDiagnosticsData>("/admin/diagnostics");
}

export function loadAdminDiagnosticsIntegrity({
  check,
  limit = 25,
  cursor,
}: {
  check: string;
  limit?: number;
  cursor?: string;
}): Promise<AdminIntegrityData> {
  return request<AdminIntegrityData>(queryPath("/admin/diagnostics/integrity", {
    check,
    limit,
    cursor,
  }));
}

export function declareSpot(payload: SpotRequest): Promise<ActionResponse> {
  return request<ActionResponse>("/spots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function shareSpot(payload: ShareRequest): Promise<ActionResponse> {
  return request<ActionResponse>("/shares", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reserveSpot(id: string, idempotencyKey: string): Promise<ActionResponse> {
  return request<ActionResponse>(`/availability/${id}/reservations`, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function cancelReservation(id: string): Promise<ActionResponse> {
  return request<ActionResponse>(`/reservations/${id}`, { method: "DELETE" });
}

export function withdrawAvailability(id: string): Promise<ActionResponse> {
  return request<ActionResponse>(`/availability/${id}`, { method: "DELETE" });
}
