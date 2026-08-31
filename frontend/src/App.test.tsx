import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { relativePathname } from "./config";
import type { DashboardData, OrganizationBranding, SessionData } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.removeItem("parkventory:locale:v1");
  window.history.replaceState({}, "", "/fr/");
});

beforeEach(() => {
  window.localStorage.removeItem("parkventory:locale:v1");
  window.history.replaceState({}, "", "/fr/");
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const victorBuckBranding: OrganizationBranding = {
  enabled: true,
  companyName: "Victor Buck Services",
  logoUrl: "/brands/victor-buck-services/logo.svg",
  colors: {
    actionFill: "#003595",
    onAction: "#FFFFFF",
    availableFill: "#01E1FF",
    onAvailable: "#00222A",
    highlight: "#E31C79",
    dark: { actionInk: "#7FAAFF", availableInk: "#01E1FF" },
    light: { actionInk: "#003595", availableInk: "#00616E" },
  },
};

const session: SessionData = {
  authenticated: true,
  displayName: "Alex Martin",
  email: "alex@acme.test",
  organizationName: "Acme",
  role: "MEMBER",
  branding: null,
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
  branding: null,
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

const victorBuckSession = {
  ...session,
  organizationName: "Victor Buck Services",
  branding: victorBuckBranding,
};

const victorBuckDashboard: DashboardData = {
  ...dashboard,
  organization: { ...dashboard.organization, name: "Victor Buck Services" },
  branding: victorBuckBranding,
};

function stubAuthenticatedApi(
  loadedSession: SessionData = session,
  loadedDashboard: DashboardData = dashboard,
) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/auth/session") && init?.method === "DELETE") {
      return jsonResponse({ accepted: true, message: "Vous êtes déconnecté." });
    }
    if (url.endsWith("/auth/session")) return jsonResponse(loadedSession);
    if (url.endsWith("/dashboard")) return jsonResponse(loadedDashboard);
    throw new Error(`Unexpected request: ${url}`);
  }));
}

describe("Parkventory", () => {
  it("utilise la langue du navigateur sur la racine puis fixe une route localisée", async () => {
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["de-DE", "fr-FR"]);
    window.history.replaceState({}, "", "/");

    render(<App />);

    expect(screen.getByRole("heading", { name: /Teilen Sie Ihren Parkplatz/i })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe("/de/"));
    expect(document.documentElement).toHaveAttribute("lang", "de");
  });

  it("résout les routes directes sous une base", () => {
    expect(relativePathname("/parkventory/fr/app/partager", "/parkventory/")).toBe("/fr/app/partager");
    expect(relativePathname("/parkventory/fr/auth/callback", "/parkventory/")).toBe("/fr/auth/callback");
  });

  it("présente la promesse et les deux actions cœur", () => {
    const { container } = render(<App />);
    expect(screen.getByRole("heading", { name: /Partagez votre place/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Parkventory, accueil" })).toHaveAttribute("href", "/fr/");
    expect(screen.getByRole("link", { name: /Partager ma place/i })).toHaveAttribute("href", "/fr/app/partager");
    expect(screen.getByRole("link", { name: /Voir les disponibilités/i })).toHaveAttribute("href", "/fr/app/trouver");
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
  });

  it("ouvre le menu mobile public et le referme avec Échap en restaurant le focus", async () => {
    render(<App />);
    const trigger = screen.getByRole("button", { name: "Ouvrir le menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Fermer le menu" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Navigation mobile" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Navigation mobile" })).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("affiche la connexion lorsqu’aucune session n’existe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Session expirée." }, 401)));
    window.history.replaceState({}, "", "/fr/app");
    render(<App />);
    expect(await screen.findByRole("heading", { name: /Connectez-vous sans mot de passe/i })).toBeInTheDocument();
  });

  it("retraduit l’échec de contrôle de session après un changement de langue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Service indisponible." }, 503)));
    window.history.replaceState({}, "", "/fr/app");
    render(<App />);

    expect(await screen.findByText("La connexion n’a pas pu être vérifiée.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Choisir la langue"), { target: { value: "de" } });

    expect(await screen.findByText("Ihre Anmeldung konnte nicht überprüft werden.")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/de/app");
  });

  it("ne consomme un lien magique qu’une fois et conserve le succès sous StrictMode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(victorBuckSession));
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", `/fr/auth/callback?token=${"a".repeat(43)}`);
    const { container } = render(<StrictMode><App /></StrictMode>);
    expect(await screen.findByRole("heading", { name: "Connexion réussie" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
    expect(screen.getByRole("heading", { name: "Connexion réussie" })).toBeInTheDocument();
  });

  it("charge les disponibilités du membre sans exposer l’infrastructure", async () => {
    stubAuthenticatedApi();
    window.history.replaceState({}, "", "/fr/app");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Bonjour, Alex" })).toBeInTheDocument();
    expect(screen.getByText("Disponibilités · 7 jours")).toBeInTheDocument();
    expect(screen.getByText("Version bêta")).toBeInTheDocument();
    expect(screen.queryByText(/Cloudflare|D1/i)).not.toBeInTheDocument();
  });

  it("garde les logos du shell connecté dans l’application", async () => {
    let desktopMatches = false;
    let desktopLayoutListener: (() => void) | null = null;
    const desktopLayout = {
      get matches() {
        return desktopMatches;
      },
      media: "(min-width: 821px)",
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        desktopLayoutListener = listener;
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn(() => desktopLayout));
    stubAuthenticatedApi();
    window.history.replaceState({}, "", "/fr/app/trouver");
    const { container } = render(<App />);

    const logos = await screen.findAllByRole("link", { name: "Accueil de l’application Parkventory" });
    expect(logos).toHaveLength(2);
    logos.forEach((logo) => expect(logo).toHaveAttribute("href", "/fr/app"));

    const menuTrigger = screen.getByRole("button", { name: "Ouvrir la navigation" });
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(menuTrigger).toHaveAttribute("aria-controls", "application-sidebar");
    fireEvent.click(menuTrigger);
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Navigation de l’application" }))
      .toHaveAttribute("aria-modal", "true");
    expect(document.getElementById("dashboard-content")).toHaveAttribute("inert");
    expect(container.querySelector(".mobile-app-nav")).toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.overscrollBehavior).toBe("none");
    fireEvent.click(screen.getAllByRole("button", { name: "Fermer la navigation" })[0]);
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("dashboard-content")).not.toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.overscrollBehavior).toBe("");

    fireEvent.click(menuTrigger);
    desktopMatches = true;
    act(() => desktopLayoutListener?.());
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog", { name: "Navigation de l’application" }))
      .not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");

    fireEvent.click(logos[0]);
    expect(window.location.pathname).toBe("/fr/app");
    expect(await screen.findByRole("heading", { name: "Bonjour, Alex" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Partagez votre place/i })).not.toBeInTheDocument();
  });

  it("applique la co-marque Victor Buck Services uniquement dans le shell connecté", async () => {
    stubAuthenticatedApi(victorBuckSession, victorBuckDashboard);
    window.history.replaceState({}, "", "/fr/app");
    const { container } = render(<App />);

    const homeLinks = await screen.findAllByRole("link", {
      name: "Accueil de l’application Victor Buck Services sur Parkventory",
    });
    expect(homeLinks).toHaveLength(2);
    homeLinks.forEach((link) => expect(link).toHaveAttribute("href", "/fr/app"));
    expect(screen.getAllByRole("img", { name: "Victor Buck Services, avec Parkventory" })).toHaveLength(2);
    expect(container.querySelectorAll("img.organization-logo")).toHaveLength(2);
    expect(container.querySelectorAll(".organization-parkventory-badge img")).toHaveLength(2);

    const scope = container.querySelector<HTMLElement>(".organization-brand-scope");
    expect(scope).toHaveAttribute("data-organization-branding", "active");
    expect(scope?.style.getPropertyValue("--organization-action-fill")).toBe("#003595");
    expect(scope?.style.getPropertyValue("--organization-highlight")).toBe("#E31C79");
  });

  it("respecte un opt-out frais du dashboard même si la session avait un thème", async () => {
    stubAuthenticatedApi(victorBuckSession, {
      ...victorBuckDashboard,
      branding: null,
    });
    window.history.replaceState({}, "", "/fr/app");
    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Bonjour, Alex" })).toBeInTheDocument();
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Accueil de l’application Parkventory" })).toHaveLength(2);
  });

  it("retire le branding d’entreprise à la déconnexion", async () => {
    stubAuthenticatedApi(victorBuckSession, victorBuckDashboard);
    window.history.replaceState({}, "", "/fr/app");
    const { container } = render(<App />);

    await screen.findAllByRole("link", {
      name: "Accueil de l’application Victor Buck Services sur Parkventory",
    });
    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    expect(await screen.findByRole("heading", { name: /Connectez-vous sans mot de passe/i })).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument());
    expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
  });

  it("rend une vraie page 404 sans appeler l’API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/fr/app/inconnue");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Cette place n’existe pas." })).toBeInTheDocument();
    expect(screen.getByLabelText("Choisir la langue")).toHaveValue("fr");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("transfère le focus vers le titre après une navigation légale interne", async () => {
    window.history.replaceState({}, "", "/fr/confidentialite");
    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "Mentions légales" }));

    const heading = await screen.findByRole("heading", { level: 1, name: "Mentions légales" });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(window.location.pathname).toBe("/fr/mentions-legales");
  });
});
