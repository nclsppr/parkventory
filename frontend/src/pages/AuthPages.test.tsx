import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthCallbackPage, SignInPage, sessionLandingUrl } from "./AuthPages";
import { ThemeProvider } from "../components/Theme";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete window.turnstile;
  document.getElementById("cloudflare-turnstile-script")?.remove();
});

describe("authentication destinations", () => {
  it("oriente uniquement une session godmode vers la console", () => {
    expect(sessionLandingUrl({ godmode: true })).toBe("/admin");
    expect(sessionLandingUrl({ godmode: false })).toBe("/app");
  });

  it("autorise un domaine personnel dans le formulaire opérateur et laisse le serveur décider", async () => {
    const script = document.createElement("script");
    script.id = "cloudflare-turnstile-script";
    document.head.append(script);
    window.turnstile = {
      render: (_element, options) => {
        options.callback("turnstile-test-token");
        return "widget-test";
      },
      remove: vi.fn(),
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ accepted: true, message: "Si l’adresse est autorisée, un lien a été envoyé." }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);
    render(<ThemeProvider><SignInPage mode="admin" /></ThemeProvider>);

    fireEvent.change(screen.getByLabelText("Adresse opérateur autorisée"), { target: { value: "operator@gmail.com" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Recevoir mon lien" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Recevoir mon lien" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/requests", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        email: "operator@gmail.com",
        turnstileToken: "turnstile-test-token",
        purpose: "admin",
      }),
    }));
  });

  it("conserve le blocage des domaines personnels dans le formulaire métier", async () => {
    const script = document.createElement("script");
    script.id = "cloudflare-turnstile-script";
    document.head.append(script);
    window.turnstile = {
      render: (_element, options) => {
        options.callback("turnstile-test-token");
        return "widget-test";
      },
      remove: vi.fn(),
    };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ThemeProvider><SignInPage /></ThemeProvider>);

    fireEvent.change(screen.getByLabelText("Adresse e-mail professionnelle"), { target: { value: "member@gmail.com" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Recevoir mon lien" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Recevoir mon lien" }));

    expect(await screen.findByText("Utilisez une adresse e-mail professionnelle.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("permet de redemander un lien opérateur après un callback incomplet", async () => {
    window.history.replaceState({}, "", "/auth/callback");
    render(<ThemeProvider><AuthCallbackPage /></ThemeProvider>);

    expect(await screen.findByRole("heading", { name: "Lien non valide." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Accès à l’espace parking/ })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("link", { name: /Accès opérateur/ })).toHaveAttribute("href", "/admin");
  });
});
