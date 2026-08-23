import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { relativePathname } from "./config";
import { demoDashboard } from "./data/demo";
import { oidcRestartMessage } from "./pages/AuthPages";
import type { DashboardData } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

it("explique le refus d’une adresse non professionnelle sans la refléter", () => {
  const message = oidcRestartMessage("?error=professional-email&email=secret@example.com");
  expect(message).toEqual({
    isError: true,
    text: "Cette adresse ne peut pas rejoindre Parkventory. Utilisez une adresse e-mail professionnelle.",
  });
  expect(message.text).not.toContain("secret@example.com");
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

function dashboardResponse(overrides: Partial<DashboardData> = {}): DashboardData {
  const availability = structuredClone(demoDashboard.availability).map((item) => ({
    ...item,
    status: "AVAILABLE" as const,
    viewerRelation: "NONE" as const,
    reservationId: null,
    canCancel: false,
    canWithdraw: false,
  }));
  return {
    ...structuredClone(demoDashboard),
    demo: false,
    user: {
      firstName: "Alex",
      fullName: "Alex Martin",
      initials: "AM",
      assignedSpot: "A-24",
      assignedLevel: "Niveau A",
      assignedSiteTimeZone: "Europe/Paris",
    },
    organization: { name: "Acme — communauté", sharedTotal: 12 },
    stats: { shares: 2, reservations: 1, availableSpots: 3 },
    availability,
    activeShares: [],
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
    expect(screen.getByRole("link", { name: "Aller au contenu" })).toHaveAttribute("href", "#contenu");
    expect(screen.getByText("Aucun administrateur requis pour démarrer")).toBeInTheDocument();
    expect(screen.getByText("Aperçu démo")).toBeInTheDocument();
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
            assignedSiteTimeZone: assigned ? "Europe/Paris" : null,
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
    fireEvent.change(within(spotForm).getByLabelText("Libellé de la place"), {
      target: { value: "A-24" },
    });
    fireEvent.change(within(spotForm).getByLabelText(/Niveau ou zone/i), {
      target: { value: "Niveau A" },
    });
    const assignButton = within(spotForm).getByRole("button", { name: "Affecter cette place" });
    expect(assignButton).toBeEnabled();
    await user.click(assignButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/spots",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
      expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/dashboard"))).toHaveLength(2);
    }, { timeout: 3_000 });
    expect(await screen.findByRole(
      "form",
      { name: "Formulaire de partage" },
      { timeout: 3_000 },
    )).toBeInTheDocument();
    const shareForm = screen.getByRole("form", { name: "Formulaire de partage" });
    expect(within(shareForm).getByText("A-24")).toBeInTheDocument();
    expect(within(shareForm).queryByRole("textbox", { name: "Votre place" })).not.toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(/affectée à votre profil/i);
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

  it("signale un horaire inversé sans contrôle invisible au clavier", async () => {
    const fetchMock = stubAuthenticatedApi();
    window.history.replaceState({}, "", "/app/partager");
    const user = userEvent.setup();
    render(<App />);

    const form = await screen.findByRole("form", { name: "Formulaire de partage" });
    expect(within(form).queryByDisplayValue("A-24")).not.toBeInTheDocument();
    fireEvent.change(within(form).getByLabelText("Début"), { target: { value: "19:00" } });

    expect(within(form).getByRole("alert")).toHaveTextContent(/postérieure/i);
    expect(within(form).getByLabelText("Début")).toHaveAttribute("aria-invalid", "true");
    expect(within(form).getByLabelText("Fin")).toHaveAttribute("aria-invalid", "true");
    const submit = screen.getByRole("button", { name: "Partager ma place" });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/shares"))).toBe(false);
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
        dashboard.availability[0].timeZone = "America/Toronto";
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
    expect(document.querySelector(".reservation-summary"))
      .toHaveTextContent("America/Toronto");
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

  it("annule une réservation une seule fois malgré une double soumission", async () => {
    const available = dashboardResponse().availability[0];
    const reserved = {
      ...available,
      status: "RESERVED" as const,
      viewerRelation: "RESERVED" as const,
      reservationId: "8f8cdfa7-2f0c-4d96-b546-d02e23e21f7a",
      canCancel: true,
      canWithdraw: false,
    };
    let cancelled = false;
    let cancellationCalls = 0;
    let releaseCancellation!: () => void;
    const cancellationGate = new Promise<void>((resolve) => {
      releaseCancellation = resolve;
    });
    const fetchMock = stubAuthenticatedApi((url, init) => {
      if (url.endsWith(`/reservations/${reserved.reservationId}`) && init?.method === "DELETE") {
        cancellationCalls += 1;
        return cancellationGate.then(() => {
          cancelled = true;
          return jsonResponse({ accepted: true, message: "La réservation est annulée." });
        });
      }
      if (url.endsWith("/dashboard")) {
        return jsonResponse(dashboardResponse({
          availability: cancelled ? [available] : [reserved],
        }));
      }
      return undefined;
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    window.history.replaceState({}, "", "/app/trouver");
    render(<App />);

    const cancelButton = await screen.findByRole("button", { name: "Annuler" });
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);
    expect(cancellationCalls).toBe(1);
    expect(cancelButton).toHaveAttribute("aria-busy", "true");

    releaseCancellation();
    expect(await screen.findByRole("status")).toHaveTextContent(/réservation est annulée/i);
    await waitFor(() => expect(fetchMock.mock.calls.filter(
      ([url, init]) => String(url).includes("/reservations/") && init?.method === "DELETE",
    )).toHaveLength(1));
  });

  it("retire un partage non réservé depuis la route de partage", async () => {
    const ownShare = {
      ...dashboardResponse().availability[0],
      status: "UNAVAILABLE" as const,
      viewerRelation: "OFFERED" as const,
      reservationId: null,
      canCancel: false,
      canWithdraw: true,
    };
    let withdrawn = false;
    const fetchMock = stubAuthenticatedApi((url, init) => {
      if (url.endsWith(`/availability/${ownShare.id}`) && init?.method === "DELETE") {
        withdrawn = true;
        return jsonResponse({ accepted: true, message: "La disponibilité est retirée." });
      }
      if (url.endsWith("/dashboard")) {
        return jsonResponse(dashboardResponse({
          activeShares: withdrawn ? [] : [ownShare],
        }));
      }
      return undefined;
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    window.history.replaceState({}, "", "/app/partager");
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Retirer" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/disponibilité est retirée/i);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/availability/${ownShare.id}`,
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
    expect(await screen.findByRole("heading", { name: "Aucun partage actif." })).toBeInTheDocument();
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
