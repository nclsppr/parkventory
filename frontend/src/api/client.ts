import { demoDashboard } from "../data/demo";
import type {
  ActionResponse,
  DashboardData,
  InvitationRequest,
  ShareRequest,
} from "../types";

const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(2500),
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const message =
      problem && typeof problem.detail === "string"
        ? problem.detail
        : `La requête a échoué (${response.status}).`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function loadDashboard(): Promise<DashboardData> {
  try {
    return await request<DashboardData>("/dashboard");
  } catch {
    return structuredClone(demoDashboard);
  }
}

export async function shareSpot(payload: ShareRequest): Promise<ActionResponse> {
  try {
    return await request<ActionResponse>("/shares", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      accepted: true,
      message: `La place ${payload.spot} est partagée dans cette démo locale.`,
    };
  }
}

export async function reserveSpot(id: string): Promise<ActionResponse> {
  try {
    return await request<ActionResponse>(`/availability/${id}/reservations`, {
      method: "POST",
    });
  } catch {
    return {
      accepted: true,
      message: "La place est réservée dans cette démo locale.",
    };
  }
}

export async function inviteColleague(
  payload: InvitationRequest,
): Promise<ActionResponse> {
  return request<ActionResponse>("/invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => ({
    accepted: true,
    message: `Une invitation de démonstration a été préparée pour ${payload.email}.`,
  }));
}
