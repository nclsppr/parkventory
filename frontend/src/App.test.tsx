import { StrictMode } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
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

describe("Parkventory", () => {
  it("résout les routes sous le chemin GitHub Pages", () => {
    expect(relativePathname("/parkventory/", "/parkventory/")).toBe("/");
    expect(relativePathname("/parkventory/app", "/parkventory/")).toBe("/app");
    expect(relativePathname("/parkventory/auth/callback", "/parkventory/")).toBe("/auth/callback");
  });

  it("présente la promesse et les actions principales sur la landing", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);

    expect(screen.getByRole("heading", { name: /Partagez votre place/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Partager ma place/i })).toHaveAttribute("href", "/app?intent=share");
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

  it("ne remplace jamais une session absente par les données fictives", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse({ status: 401, detail: "Authentification requise." }, 401),
    ));
    window.history.replaceState({}, "", "/app");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Connectez-vous sans mot de passe/i })).toBeInTheDocument();
    expect(screen.queryByText(/Bonjour, Nicolas/i)).not.toBeInTheDocument();
  });

  it("ne consomme le lien magique qu’une fois sous StrictMode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      authenticated: true,
      displayName: "Alex Martin",
      email: "alex@acme.test",
      organizationName: "Acme — communauté",
      role: "MEMBER",
    }));
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

  it("charge PostgreSQL et permet de déclarer la première place", async () => {
    let assigned = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/session")) {
        return jsonResponse({
          authenticated: true,
          displayName: "Alex Martin",
          email: "alex@acme.test",
          organizationName: "Acme — communauté",
          role: "MEMBER",
        });
      }
      if (url.endsWith("/spots") && init?.method === "POST") {
        assigned = true;
        return jsonResponse({
          accepted: true,
          message: "La place A-24 est maintenant affectée à votre profil.",
        });
      }
      if (url.endsWith("/dashboard")) {
        return jsonResponse({
          ...structuredClone(demoDashboard),
          demo: false,
          user: {
            firstName: "Alex",
            fullName: "Alex Martin",
            initials: "AM",
            assignedSpot: assigned ? "A-24" : null,
            assignedLevel: assigned ? "Niveau A" : null,
          },
          organization: { name: "Acme — communauté", sharedTotal: 0 },
          stats: { shares: 0, reservations: 0, availableSpots: 0 },
          availability: [],
          thanks: [],
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/app");
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Bonjour, Alex/i })).toBeInTheDocument();
    const spotForm = screen.getByRole("form", { name: "Déclarer ma place" });
    await user.type(within(spotForm).getByLabelText("Libellé de la place"), "A-24");
    await user.type(within(spotForm).getByLabelText(/Niveau ou zone/i), "Niveau A");
    await user.click(within(spotForm).getByRole("button", { name: "Affecter cette place" }));

    expect(await screen.findByRole("form", { name: "Formulaire de partage" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("A-24")).toHaveAttribute("readonly");
    expect(await screen.findByRole("status")).toHaveTextContent(/affectée à votre profil/i);
  });
});
