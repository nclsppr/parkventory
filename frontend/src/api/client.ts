import {
  defaultLocale,
  isLocale,
  localeConfig,
} from "../../../shared/i18n";
import { applicationMessages } from "../i18n/application";
import type {
  ActionResponse,
  DashboardData,
  SessionData,
  ShareRequest,
  SpotRequest,
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
      message = copy.serviceProblem;
    }
    throw new ApiError(message, response.status, retryAfter);
  }

  return response.json() as Promise<T>;
}

export function requestMagicLink(email: string, turnstileToken: string): Promise<ActionResponse> {
  return request<ActionResponse>("/auth/requests", {
    method: "POST",
    body: JSON.stringify({ email, turnstileToken }),
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
