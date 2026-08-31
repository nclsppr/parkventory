import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { relativePathname } from "./config";
import type { DashboardData, OrganizationBranding, SessionData } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
  window.history.replaceState({}, "", "/");
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
    actionFill: "#0D92D2",
    onAction: "#030504",
    availableFill: "#E31C79",
    onAvailable: "#030504",
    highlight: "#E31C79",
    dark: { actionInk: "#0D92D2", availableInk: "#E31C79" },
    light: { actionInk: "#00537F", availableInk: "#C31465" },
  },
};

const session: SessionData = {
  authenticated: true,
  displayName: "Alex Martin",
  email: "alex@acme.test",
  organizationName: "Acme",
  role: "MEMBER",
  godmode: false,
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

const godmodeSession: SessionData = {
  authenticated: true,
  displayName: "Opérateur Parkventory",
  email: "operator@system.test",
  organizationName: "Parkventory",
  role: "ADMIN",
  godmode: true,
  branding: null,
};

const adminOverview = {
  generatedAt: 1_777_000_000,
  window: { days: 30, from: 1_774_408_000, to: 1_777_000_000, timeZone: "UTC" },
  totals: { tenants: 2, users: 8, parkingSpots: 5, shares: 12, reservations: 7, activeSessions: 3 },
  period: {
    newTenants: 1,
    newUsers: 3,
    shares: 6,
    reservations: 4,
    incidents: 0,
    activeUsers7d: 4,
    activeUsers30d: 6,
    withdrawals: 1,
    cancellations: 1,
    reservationRate: 4 / 6,
  },
  series: [{ date: "2026-04-23", newTenants: 1, newUsers: 3, shares: 6, reservations: 4, incidents: 0 }],
};

const adminDiagnostics = {
  generatedAt: 1_777_000_000,
  database: { status: "ok" },
  telemetry: { events: 18, oldestEventAt: 1_776_000_000, latestEventAt: 1_777_000_000 },
  authentication: {
    pendingMagicLinks: 0,
    expiredMagicLinks: 2,
    activeTenantSessions: 3,
    activeSystemSessions: 1,
    revokedSessions: 1,
  },
  incidents: { last24Hours: 0, last7Days: 0, latest: [] },
  integrity: { status: "healthy", issueCount: 0, checks: [] },
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
  it("résout les routes directes sous une base", () => {
    expect(relativePathname("/parkventory/app/partager", "/parkventory/")).toBe("/app/partager");
    expect(relativePathname("/parkventory/auth/callback", "/parkventory/")).toBe("/auth/callback");
  });

  it("présente la promesse et les deux actions cœur", () => {
    const { container } = render(<App />);
    expect(screen.getByRole("heading", { name: /Partagez votre place/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Parkventory, accueil" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Partager ma place/i })).toHaveAttribute("href", "/app/partager");
    expect(screen.getByRole("link", { name: /Voir les disponibilités/i })).toHaveAttribute("href", "/app/trouver");
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
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

  it("affiche une entrée opérateur dédiée sur /admin sans révéler l’allowlist", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Session expirée." }, 401)));
    window.history.replaceState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Accédez à la console d’exploitation." })).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse opérateur autorisée")).toHaveAttribute("type", "email");
    expect(screen.getByText(/n’est jamais affichée/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(godmodeSession.email);
  });

  it("rend une 404 aux sessions tenant sans charger le module ou les API admin", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(session));
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Cette place n’existe pas." })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /console/i })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/v1/admin/"), expect.anything());
  });

  it("charge le shell Parkventory canonique et ses quatre destinations à 320 px", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) return jsonResponse(godmodeSession);
      if (url.endsWith("/admin/overview")) return jsonResponse(adminOverview);
      if (url.endsWith("/admin/tenants?limit=5")) return jsonResponse({ items: [], page: { nextCursor: null } });
      if (url.endsWith("/admin/activity?limit=8")) return jsonResponse({ items: [], page: { nextCursor: null } });
      if (url.endsWith("/admin/diagnostics")) return jsonResponse(adminDiagnostics);
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/admin");
    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Vue d’ensemble" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigation de la console d’administration" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Vue d’ensemble" })[0]).toHaveAttribute("href", "/admin");
    expect(screen.getAllByRole("link", { name: "Tenants" })[0]).toHaveAttribute("href", "/admin/tenants");
    expect(screen.getAllByRole("link", { name: "Utilisateurs" })[0]).toHaveAttribute("href", "/admin/users");
    expect(screen.getAllByRole("link", { name: "Opérations" })[0]).toHaveAttribute("href", "/admin/operations");
    const mobileNavigation = screen.getByRole("navigation", { name: "Navigation rapide de la console" });
    expect(within(mobileNavigation).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Vue", "Tenants", "Comptes", "Suivi",
    ]);
    expect(screen.queryByRole("link", { name: /Partager ma place|Trouver une place/ })).not.toBeInTheDocument();
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(await screen.findByText("Aucun tenant client.")).toBeInTheDocument();
    expect(screen.getByText("Aucun événement récent.")).toBeInTheDocument();

    const menuTrigger = screen.getByRole("button", { name: "Ouvrir la navigation" });
    fireEvent.click(menuTrigger);
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("revient à l’entrée opérateur quand la session admin expire pendant un chargement", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) return jsonResponse(godmodeSession);
      return jsonResponse({}, 401);
    }));
    window.history.replaceState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Accédez à la console d’exploitation." })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /console/i })).not.toBeInTheDocument();
  });

  it("affiche une erreur admin actionnable puis recharge la vue", async () => {
    let overviewAttempts = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) return jsonResponse(godmodeSession);
      if (url.endsWith("/admin/overview")) {
        overviewAttempts += 1;
        return overviewAttempts === 1 ? jsonResponse({}, 500) : jsonResponse(adminOverview);
      }
      if (url.endsWith("/admin/tenants?limit=5")) return jsonResponse({ items: [], page: { nextCursor: null } });
      if (url.endsWith("/admin/activity?limit=8")) return jsonResponse({ items: [], page: { nextCursor: null } });
      if (url.endsWith("/admin/diagnostics")) return jsonResponse(adminDiagnostics);
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByText("Le service rencontre un problème. Réessayez dans un instant.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Réessayer/ }));
    expect(await screen.findByRole("heading", { name: "Posture du réseau" })).toBeInTheDocument();
    expect(overviewAttempts).toBe(2);
  });

  it("rend l’état tenant introuvable sur une réponse admin 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) return jsonResponse(godmodeSession);
      if (url.endsWith("/admin/tenants/org_missing")) return jsonResponse({ detail: "Ce tenant n’existe pas." }, 404);
      throw new Error(`Unexpected request: ${url}`);
    }));
    window.history.replaceState({}, "", "/admin/tenants/org_missing");
    render(<App />);

    expect(await screen.findByText("Tenant introuvable.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tous les tenants/ })).toHaveAttribute("href", "/admin/tenants");
  });

  it("traduit les diagnostics et expose les références incident et requête", async () => {
    const diagnostics = {
      ...adminDiagnostics,
      incidents: {
        last24Hours: 1,
        last7Days: 1,
        latest: [{
          id: "event_1",
          incidentId: "inc_public_1",
          occurredAt: 1_777_000_000,
          route: "/api/v1/reservations",
          errorCode: "UNHANDLED_ERROR",
          requestId: "req_public_1",
        }],
      },
      integrity: {
        status: "attention",
        issueCount: 2,
        checks: [
          {
            key: "active_offer_overlap",
            label: "Offres actives qui se chevauchent",
            severity: "WARNING",
            count: 2,
            status: "attention",
            detail: "Deux fenêtres actives se chevauchent.",
          },
          {
            key: "system_organization_count",
            label: "Organisation système unique",
            severity: "ERROR",
            count: 0,
            status: "ok",
            detail: "Une seule organisation système est présente.",
          },
        ],
      },
    };
    let integritySecondPageRequests = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) return jsonResponse(godmodeSession);
      if (url.endsWith("/admin/diagnostics")) return jsonResponse(diagnostics);
      if (url.endsWith("/admin/diagnostics/integrity?check=active_offer_overlap&limit=25")) {
        return jsonResponse({
          check: "active_offer_overlap",
          items: [{
            issueKind: "ROW",
            organizationId: "org_1",
            references: [{ type: "AVAILABILITY_OFFER", id: "share_1" }],
            occurrences: 2,
          }],
          page: { nextCursor: "integrity_cursor" },
        });
      }
      if (url.endsWith("/admin/diagnostics/integrity?check=active_offer_overlap&limit=25&cursor=integrity_cursor")) {
        integritySecondPageRequests += 1;
        if (integritySecondPageRequests > 1) {
          return jsonResponse({
            check: "active_offer_overlap",
            items: [],
            page: { nextCursor: null },
          });
        }
        return jsonResponse({
          check: "active_offer_overlap",
          items: [{
            issueKind: "MISSING",
            organizationId: null,
            references: [{ type: "RESERVATION", id: "reservation_missing" }],
            occurrences: 1,
          }],
          page: { nextCursor: null },
        });
      }
      if (url.endsWith("/admin/activity?limit=50&errorCode=UNHANDLED_ERROR")) {
        return jsonResponse({ items: [], page: { nextCursor: null } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/admin/operations?view=diagnostics");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Contrôles d’intégrité" })).toBeInTheDocument();
    expect(screen.getByText("Avertissement")).toBeInTheDocument();
    expect(screen.getByText("À examiner")).toBeInTheDocument();
    expect(screen.getByText("Conforme")).toBeInTheDocument();
    expect(screen.queryByText("Erreur")).not.toBeInTheDocument();
    expect(screen.getByText("Base de données opérationnelle")).toBeInTheDocument();
    expect(screen.getByTitle("inc_public_1")).toHaveTextContent("Incident · inc_public_1");
    expect(screen.getByTitle("req_public_1")).toHaveTextContent("Requête · req_public_1");
    const incidentCode = screen.getByRole("link", { name: "UNHANDLED_ERROR" });
    expect(incidentCode).toHaveAttribute("href", "/admin/operations?errorCode=UNHANDLED_ERROR");

    fireEvent.click(screen.getByRole("link", { name: "Voir les lignes" }));
    expect(window.location.search).toBe("?view=diagnostics&check=active_offer_overlap");
    const integrityHeading = await screen.findByRole("heading", { name: "Lignes à examiner" });
    expect(integrityHeading).toBeInTheDocument();
    await waitFor(() => expect(integrityHeading).toHaveFocus());
    expect(screen.getByRole("link", { name: "Ouvrir le tenant org_1" })).toHaveAttribute("href", "/admin/tenants/org_1");
    expect(screen.getByRole("link", { name: "Rechercher la référence AVAILABILITY_OFFER share_1 dans le journal" })).toHaveAttribute("href", "/admin/operations?reference=share_1");
    expect(screen.getByText("occurrences")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(await screen.findByText("reservation_missing")).toBeInTheDocument();
    expect(screen.getByText("Portée système")).toBeInTheDocument();

    const integrityRequestsBeforeRefresh = fetchMock.mock.calls.filter(([input]) => (
      String(input).includes("/admin/diagnostics/integrity?")
    )).length;
    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));
    await waitFor(() => expect(fetchMock.mock.calls.filter(([input]) => (
      String(input).includes("/admin/diagnostics/integrity?")
    ))).toHaveLength(integrityRequestsBeforeRefresh + 1));
    expect(await screen.findByText("Cette page ne contient plus de ligne.")).toBeInTheDocument();
    const previousPage = screen.getByRole("button", { name: /Précédent/ });
    expect(previousPage).toBeEnabled();
    fireEvent.click(previousPage);
    expect(await screen.findByText("share_1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "UNHANDLED_ERROR" }));
    expect(await screen.findByRole("heading", { name: "Journal d’activité" })).toBeInTheDocument();
    expect(screen.getByLabelText("Code d’erreur exact")).toHaveValue("UNHANDLED_ERROR");
    const emptyActivity = await screen.findByText("Aucun événement correspondant.");
    expect(emptyActivity.closest('[role="status"]')).not.toBeNull();
  });

  it("recherche et pagine les tenants avec les curseurs opaques du serveur", async () => {
    const tenant = (id: string, name: string) => ({
      id,
      name,
      domain: `${id}.test`,
      createdAt: 1_777_000_000,
      memberCount: 2,
      spotCount: 1,
      shareCount: 3,
      reservationCount: 2,
      activeSessionCount: 1,
      lastActivityAt: 1_777_000_000,
      brandingEnabled: false,
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) return jsonResponse(godmodeSession);
      if (url.endsWith("/admin/tenants?limit=25")) {
        return jsonResponse({ items: [tenant("alpha", "Tenant Alpha")], page: { nextCursor: "opaque_cursor" } });
      }
      if (url.endsWith("/admin/tenants?limit=25&cursor=opaque_cursor")) {
        return jsonResponse({ items: [tenant("beta", "Tenant Beta")], page: { nextCursor: null } });
      }
      if (url.endsWith("/admin/tenants?limit=25&q=Acme")) {
        return jsonResponse({ items: [tenant("acme", "Acme")], page: { nextCursor: null } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/admin/tenants");
    render(<App />);

    expect(await screen.findByText("Tenant Alpha")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(await screen.findByText("Tenant Beta")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Rechercher un tenant"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));
    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(window.location.search).toBe("?q=Acme");
  });

  it("ne donne pas accès à l’application métier au compte système", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(godmodeSession));
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/app");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Cette place n’existe pas." })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: /Partager ma place|Trouver une place/ })).not.toBeInTheDocument();
  });

  it("masque la console si une autorisation godmode est révoquée", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) return jsonResponse(godmodeSession);
      return jsonResponse({}, 403);
    }));
    window.history.replaceState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Cette place n’existe pas." })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /console/i })).not.toBeInTheDocument();
  });

  it("ne consomme un lien magique qu’une fois et conserve le succès sous StrictMode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(victorBuckSession));
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", `/auth/callback#token=${"a".repeat(43)}`);
    const { container } = render(<StrictMode><App /></StrictMode>);
    expect(await screen.findByRole("heading", { name: "Vous êtes connecté." })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("");
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
    expect(screen.getByRole("heading", { name: "Vous êtes connecté." })).toBeInTheDocument();
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

  it("applique la co-marque Victor Buck Services uniquement dans le shell connecté", async () => {
    stubAuthenticatedApi(victorBuckSession, victorBuckDashboard);
    window.history.replaceState({}, "", "/app");
    const { container } = render(<App />);

    const homeLinks = await screen.findAllByRole("link", {
      name: "Accueil de l’application Victor Buck Services sur Parkventory",
    });
    expect(homeLinks).toHaveLength(2);
    homeLinks.forEach((link) => expect(link).toHaveAttribute("href", "/app"));
    expect(screen.getAllByRole("img", { name: "Victor Buck Services, avec Parkventory" })).toHaveLength(2);
    expect(container.querySelectorAll("img.organization-logo")).toHaveLength(2);
    expect(container.querySelectorAll(".organization-parkventory-badge img")).toHaveLength(2);

    const scope = container.querySelector<HTMLElement>(".organization-brand-scope");
    expect(scope).toHaveAttribute("data-organization-branding", "active");
    expect(scope?.style.getPropertyValue("--organization-action-fill")).toBe("#0D92D2");
    expect(scope?.style.getPropertyValue("--organization-highlight")).toBe("#E31C79");
  });

  it("respecte un opt-out frais du dashboard même si la session avait un thème", async () => {
    stubAuthenticatedApi(victorBuckSession, {
      ...victorBuckDashboard,
      branding: null,
    });
    window.history.replaceState({}, "", "/app");
    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Bonjour, Alex" })).toBeInTheDocument();
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Accueil de l’application Parkventory" })).toHaveLength(2);
  });

  it("retire le branding d’entreprise à la déconnexion", async () => {
    stubAuthenticatedApi(victorBuckSession, victorBuckDashboard);
    window.history.replaceState({}, "", "/app");
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
    window.history.replaceState({}, "", "/app/inconnue");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Cette place n’existe pas." })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
