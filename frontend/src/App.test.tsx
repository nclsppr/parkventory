import { StrictMode } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { relativePathname } from "./config";
import { demoDashboard } from "./data/demo";

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

function sessionResponse() {
  return {
    authenticated: true,
    displayName: "Alex Martin",
    email: "alex@acme.test",
    organizationName: "Acme — communauté",
    role: "MEMBER",
  };
}

function dashboardResponse(overrides: Record<string, unknown> = {}) {
  return {
    ...structuredClone(demoDashboard),
    demo: false,
    user: {
      firstName: "Alex",
      fullName: "Alex Martin",
      initials: "AM",
      assignedSpot: "A-24",
      assignedLevel: "Niveau A",
    },
    organization: { name: "Acme — communauté", sharedTotal: 12 },
    stats: { shares: 2, reservations: 1, availableSpots: 3 },
    thanks: [],
    ...overrides,
  };
}

function stubAuthenticatedApi(
  handler?: (url: string, init?: RequestInit) => Response | Promise<Response> | undefined,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const handled = handler?.(url, init);
    if (handled) return handled;
    if (url.endsWith("/auth/session")) return jsonResponse(sessionResponse());
    if (url.endsWith("/dashboard")) return jsonResponse(dashboardResponse());
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Parkventory", () => {
  it("résout toutes les routes sous le chemin GitHub Pages", () => {
    expect(relativePathname("/parkventory/", "/parkventory/")).toBe("/");
    expect(relativePathname("/parkventory/app", "/parkventory/")).toBe("/app");
    expect(relativePathname("/parkventory/app/partager", "/parkventory/")).toBe("/app/partager");
    expect(relativePathname("/parkventory/app/trouver", "/parkventory/")).toBe("/app/trouver");
    expect(relativePathname("/parkventory/auth/callback", "/parkventory/")).toBe("/auth/callback");
  });

  it("présente la promesse et les routes produit sur la landing", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Partagez votre place/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Partager ma place/i })).toHaveAttribute("href", "/app/partager");
    expect(screen.getByRole("link", { name: /Voir les disponibilités/i })).toHaveAttribute("href", "/app/trouver");
    expect(screen.getByText("Aucun administrateur requis pour démarrer")).toBeInTheDocument();
  });

  it("demande un vrai lien local depuis la landing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      accepted: true,
      message: "Un lien de connexion a été envoyé. En local, ouvrez-le depuis Mailpit.",
    }, 202));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Adresse e-mail professionnelle"), "alex@acme.test");
    await user.click(screen.getByRole("button", { name: "Rejoindre Parkventory" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/envoyé/i);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/requests",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it.each(["/app", "/app/partager", "/app/trouver"])(
    "ne remplace jamais une session absente par les données fictives sur %s",
    async (path) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        jsonResponse({ status: 401, detail: "Authentification requise." }, 401),
      ));
      window.history.replaceState({}, "", path);
      render(<App />);

      expect(await screen.findByRole("heading", { name: /Connectez-vous sans mot de passe/i })).toBeInTheDocument();
      expect(screen.queryByText(/Bonjour, Nicolas/i)).not.toBeInTheDocument();
    },
  );

  it("ne consomme le lien magique qu’une fois sous StrictMode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sessionResponse()));
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/auth/callback?token=strict-mode-token-0123456789abcdef");

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(await screen.findByRole("heading", { name: "Vous êtes connecté." })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/verify",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("charge PostgreSQL et permet de déclarer la première place sur sa route", async () => {
    let assigned = false;
    const fetchMock = stubAuthenticatedApi((url, init) => {
      if (url.endsWith("/spots") && init?.method === "POST") {
        assigned = true;
        return jsonResponse({ accepted: true, message: "La place A-24 est maintenant affectée à votre profil." });
      }
      if (url.endsWith("/dashboard")) {
        return jsonResponse(dashboardResponse({
          user: {
            firstName: "Alex",
            fullName: "Alex Martin",
            initials: "AM",
            assignedSpot: assigned ? "A-24" : null,
            assignedLevel: assigned ? "Niveau A" : null,
          },
          stats: { shares: 0, reservations: 0, availableSpots: 0 },
          availability: [],
        }));
      }
      return undefined;
    });
    window.history.replaceState({}, "", "/app/partager");
    const user = userEvent.setup();
    render(<App />);

    const spotForm = await screen.findByRole("form", { name: "Déclarer ma place" });
    await user.type(within(spotForm).getByLabelText("Libellé de la place"), "A-24");
    await user.type(within(spotForm).getByLabelText(/Niveau ou zone/i), "Niveau A");
    await user.click(within(spotForm).getByRole("button", { name: "Affecter cette place" }));

    expect(await screen.findByRole("form", { name: "Formulaire de partage" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("A-24")).toHaveAttribute("readonly");
    expect(await screen.findByRole("status")).toHaveTextContent(/affectée à votre profil/i);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/spots",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("publie un partage réel depuis la route dédiée", async () => {
    const fetchMock = stubAuthenticatedApi((url, init) => {
      if (url.endsWith("/shares") && init?.method === "POST") {
        return jsonResponse({ accepted: true, message: "La disponibilité de A-24 a été publiée." });
      }
      return undefined;
    });
    window.history.replaceState({}, "", "/app/partager");
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Partager ma place" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Partager ma place" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/disponibilité de A-24/i);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/shares",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("sépare la sélection de la confirmation avant de réserver", async () => {
    let reserved = false;
    const fetchMock = stubAuthenticatedApi((url, init) => {
      if (url.includes("/availability/") && url.endsWith("/reservations") && init?.method === "POST") {
        reserved = true;
        return jsonResponse({ accepted: true, message: "La place A-24 est réservée." });
      }
      if (url.endsWith("/dashboard")) {
        const dashboard = dashboardResponse();
        if (reserved) dashboard.availability[0].status = "RESERVED";
        return jsonResponse(dashboard);
      }
      return undefined;
    });
    window.history.replaceState({}, "", "/app/trouver");
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: "Trouver une place" });
    await user.click(screen.getAllByRole("button", { name: "Choisir" })[0]);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/reservations"))).toBe(false);
    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/A-24 est réservée/i);
    const reservationCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/reservations"));
    expect(reservationCall?.[1]).toEqual(expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
    }));
  });

  it("navigue dans le shell, met la route active à jour et conserve les données", async () => {
    const fetchMock = stubAuthenticatedApi();
    window.history.replaceState({}, "", "/app");
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: /Bonjour, Alex/i });
    const menuTrigger = screen.getByRole("button", { name: "Ouvrir la navigation" });
    await user.click(menuTrigger);
    const sidebar = screen.getByRole("complementary", { name: "Navigation de l’application" });
    await waitFor(() => expect(
      within(sidebar).getByRole("button", { name: "Fermer la navigation" }),
    ).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(menuTrigger).toHaveFocus());
    expect(
      within(screen.getByRole("navigation", { name: "Navigation rapide" }))
        .queryByRole("link", { name: "Réservations" }),
    ).not.toBeInTheDocument();

    const navigation = screen.getByRole("navigation", { name: "Navigation principale de l’application" });
    const shareLink = within(navigation).getByRole("link", { name: "Partager ma place" });
    await user.click(shareLink);

    const shareHeading = await screen.findByRole("heading", { name: "Partager ma place" });
    await waitFor(() => expect(shareHeading).toHaveFocus());
    expect(shareLink).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/app/partager");
    expect(document.title).toBe("Partager ma place — Parkventory");
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/dashboard"))).toHaveLength(1);
  });

  it.each([
    ["share", "/app/partager", "Partager ma place"],
    ["find", "/app/trouver", "Trouver une place"],
  ])("remplace l’ancien intent %s par la route canonique", async (intent, expectedPath, heading) => {
    stubAuthenticatedApi();
    window.history.replaceState({}, "", `/app?intent=${intent}`);
    render(<App />);

    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe(expectedPath));
    expect(window.location.search).toBe("");
  });

  it("rend une vraie page 404 pour une route inconnue", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/app/inconnue");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Cette place n’existe pas." })).toBeInTheDocument();
    expect(document.title).toBe("Page introuvable — Parkventory");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
