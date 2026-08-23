import { demoDashboard } from "../data/demo";
import { demoContext, isOidcIdentity, isPublicDemo } from "../config";
import type {
  ActionResponse,
  DashboardData,
  InvitationRequest,
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
      throw new ApiError(
        isOidcIdentity
          ? "Le service met trop de temps à répondre. Réessayez."
          : "Le serveur local ne répond pas. Vérifiez Docker Compose.",
        0,
      );
    }
    throw new ApiError(
      isOidcIdentity
        ? "Impossible de joindre le service. Réessayez dans un instant."
        : "Impossible de joindre le serveur local. Vérifiez que `npm run dev` est actif.",
      0,
    );
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const serverDetail = problem && typeof problem.detail === "string"
      ? problem.detail
      : null;
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfter = retryAfterHeader && /^\d+$/.test(retryAfterHeader)
      ? Number(retryAfterHeader)
      : undefined;
    let message = serverDetail ?? `La requête a échoué (${response.status}).`;
    if (response.status === 401 && !serverDetail) {
      message = "Votre session a expiré. Reconnectez-vous pour continuer.";
    } else if (response.status === 403 && !serverDetail) {
      message = "Vous n’avez pas l’autorisation d’effectuer cette action.";
    } else if (response.status === 409 && !serverDetail) {
      message = "Ces données viennent de changer. Actualisez la page et réessayez.";
    } else if (response.status === 429) {
      message = retryAfter
        ? `Trop de demandes. Réessayez dans ${retryAfter} seconde${retryAfter > 1 ? "s" : ""}.`
        : "Trop de demandes. Patientez un instant avant de réessayer.";
    } else if (response.status >= 500) {
      message = "Le service rencontre un problème. Réessayez dans un instant.";
    }
    throw new ApiError(message, response.status, retryAfter);
  }

  return response.json() as Promise<T>;
}

export async function requestMagicLink(email: string): Promise<ActionResponse> {
  if (isPublicDemo) {
    return {
      accepted: true,
      message:
        "La démo publique n’envoie aucun e-mail. Ouvrez l’application pour explorer les données fictives.",
    };
  }
  if (isOidcIdentity) {
    throw new ApiError("Utilisez la connexion sécurisée par e-mail.", 404);
  }
  return request<ActionResponse>("/auth/requests", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyMagicLink(token: string): Promise<SessionData> {
  if (isPublicDemo) {
    throw new ApiError(
      "La démo publique ne consomme aucun lien magique. Ouvrez l’application pour explorer les données fictives.",
      0,
    );
  }
  if (isOidcIdentity) {
    throw new ApiError("Ce mode de connexion n’est pas disponible.", 404);
  }
  return request<SessionData>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function loadSession(): Promise<SessionData> {
  return request<SessionData>("/auth/session");
}

export function logout(): Promise<ActionResponse> {
  return request<ActionResponse>(
    isOidcIdentity ? "/auth/oidc/logout" : "/auth/session",
    { method: isOidcIdentity ? "POST" : "DELETE" },
  );
}

export async function loadDashboard(): Promise<DashboardData> {
  if (isPublicDemo) return structuredClone(demoDashboard);
  return request<DashboardData>("/dashboard");
}

export function declareSpot(payload: SpotRequest): Promise<ActionResponse> {
  return request<ActionResponse>("/spots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function shareSpot(payload: ShareRequest): Promise<ActionResponse> {
  if (isPublicDemo) {
    return {
      accepted: true,
      message: `La place ${payload.spot} est partagée dans cette ${demoContext}.`,
    };
  }
  return request<ActionResponse>("/shares", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reserveSpot(
  id: string,
  idempotencyKey: string,
): Promise<ActionResponse> {
  if (isPublicDemo) {
    return {
      accepted: true,
      message: `La place est réservée dans cette ${demoContext}.`,
    };
  }
  return request<ActionResponse>(`/availability/${id}/reservations`, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function cancelReservation(id: string): Promise<ActionResponse> {
  if (isPublicDemo) {
    return {
      accepted: true,
      message: `La réservation est annulée dans cette ${demoContext}.`,
    };
  }
  return request<ActionResponse>(`/reservations/${id}`, { method: "DELETE" });
}

export async function withdrawAvailability(id: string): Promise<ActionResponse> {
  if (isPublicDemo) {
    return {
      accepted: true,
      message: `La disponibilité est retirée de cette ${demoContext}.`,
    };
  }
  return request<ActionResponse>(`/availability/${id}`, { method: "DELETE" });
}

export function inviteColleague(
  payload: InvitationRequest,
): Promise<ActionResponse> {
  if (isPublicDemo) {
    return Promise.resolve({
      accepted: true,
      message: `Une invitation de démonstration a été préparée pour ${payload.email}.`,
    });
  }
  return request<ActionResponse>("/invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
