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
} from "../types";

const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";

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
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError("Le service met trop de temps à répondre. Réessayez.", 0);
    }
    throw new ApiError("Impossible de joindre Parkventory. Réessayez dans un instant.", 0);
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const serverDetail = problem && typeof problem.detail === "string" ? problem.detail : null;
    const incidentReference = response.status >= 500 && serverDetail
      ? serverDetail.match(/Référence : ([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.?$/i)?.[1]
      : undefined;
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfter = retryAfterHeader && /^\d+$/.test(retryAfterHeader)
      ? Number(retryAfterHeader)
      : undefined;
    let message = serverDetail ?? "Cette action n’a pas abouti. Réessayez.";
    if (response.status === 401 && !serverDetail) {
      message = "Votre connexion a expiré. Reconnectez-vous pour continuer.";
    } else if (response.status === 403 && !serverDetail) {
      message = "Vous n’avez pas l’autorisation d’effectuer cette action.";
    } else if (response.status === 409 && !serverDetail) {
      message = "Ces données viennent de changer. Actualisez la page et réessayez.";
    } else if (response.status === 429) {
      message = retryAfter
        ? `Trop de demandes. Réessayez dans ${retryAfter} secondes.`
        : "Trop de demandes. Patientez avant de réessayer.";
    } else if (response.status >= 500) {
      message = incidentReference
        ? `Le service rencontre un problème. Référence : ${incidentReference}.`
        : "Le service rencontre un problème. Réessayez dans un instant.";
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
