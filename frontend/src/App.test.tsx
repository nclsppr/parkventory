import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { relativePathname } from "./config";
import type { DashboardData } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const session = {
  authenticated: true,
  displayName: "Alex Martin",
  email: "alex@acme.test",
  organizationName: "Acme",
  role: "MEMBER",
};

const dashboard: DashboardData = {
  user: {
    firstName: "Alex",
    fullName: "Alex Martin",
    initials: "AM",
    assignedSpot: "A-24",
    assignedLevel: "Niveau A",
    assignedSiteTimeZone: "Europe/Paris",
  },
  organization: { name: "Acme", sharedTotal: 1 },
  stats: { shares: 1, reservations: 0, availableSpots: 1 },
  availability: [{
    id: "offer-1",
    dateLabel: "mar. 25 août",
    timeLabel: "08:00 – 18:00",
    timeZone: "Europe/Paris",
    spot: "B-18",
    level: "Niveau B",
    status: "AVAILABLE",
    viewerRelation: "NONE",
    reservationId: null,
    canCancel: false,
    canWithdraw: false,
  }],
  activeShares: [],
};

function stubAuthenticatedApi() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/auth/session")) return jsonResponse(session);
    if (url.endsWith("/dashboard")) return jsonResponse(dashboard);
    throw new Error(`Unexpected request: ${url}`);
  }));
}

describe("Parkventory", () => {
  it("résout les routes directes sous une base", () => {
    expect(relativePathname("/parkventory/app/partager", "/parkventory/")).toBe("/app/partager");
    expect(relativePathname("/parkventory/auth/callback", "/parkventory/")).toBe("/auth/callback");
  });

  it("présente la promesse et les deux actions cœur", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Partagez votre place/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Parkventory, accueil" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Partager ma place/i })).toHaveAttribute("href", "/app/partager");
    expect(screen.getByRole("link", { name: /Voir les disponibilités/i })).toHaveAttribute("href", "/app/trouver");
  });

  it("ouvre et ferme le menu mobile public", () => {
    render(<App />);
    const trigger = screen.getByRole("button", { name: "Ouvrir le menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Fermer le menu" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Navigation mobile" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fermer le menu" }));
    expect(screen.queryByRole("navigation", { name: "Navigation mobile" })).not.toBeInTheDocument();
  });

  it("affiche la connexion lorsqu’aucune session n’existe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Session expirée." }, 401)));
    window.history.replaceState({}, "", "/app");
    render(<App />);
    expect(await screen.findByRole("heading", { name: /Connectez-vous sans mot de passe/i })).toBeInTheDocument();
  });

  it("ne consomme un lien magique qu’une fois sous StrictMode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(session));
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", `/auth/callback?token=${"a".repeat(43)}`);
    render(<StrictMode><App /></StrictMode>);
    expect(await screen.findByRole("heading", { name: "Vous êtes connecté." })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("charge les disponibilités du membre sans exposer l’infrastructure", async () => {
    stubAuthenticatedApi();
    window.history.replaceState({}, "", "/app");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Bonjour, Alex" })).toBeInTheDocument();
    expect(screen.getByText("Disponibilités · 7 jours")).toBeInTheDocument();
    expect(screen.getByText("Version bêta")).toBeInTheDocument();
    expect(screen.queryByText(/Cloudflare|D1/i)).not.toBeInTheDocument();
  });

  it("garde les logos du shell connecté dans l’application", async () => {
    stubAuthenticatedApi();
    window.history.replaceState({}, "", "/app/trouver");
    render(<App />);

    const logos = await screen.findAllByRole("link", { name: "Accueil de l’application Parkventory" });
    expect(logos).toHaveLength(2);
    logos.forEach((logo) => expect(logo).toHaveAttribute("href", "/app"));

    const menuTrigger = screen.getByRole("button", { name: "Ouvrir la navigation" });
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuTrigger);
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getAllByRole("button", { name: "Fermer la navigation" })[0]);
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(logos[0]);
    expect(window.location.pathname).toBe("/app");
    expect(await screen.findByRole("heading", { name: "Bonjour, Alex" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Partagez votre place/i })).not.toBeInTheDocument();
  });

  it("rend une vraie page 404 sans appeler l’API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/app/inconnue");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Cette place n’existe pas." })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
