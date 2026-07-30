import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { relativePathname } from "./config";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("Parkventory", () => {
  it("résout les routes sous le chemin GitHub Pages", () => {
    expect(relativePathname("/parkventory/", "/parkventory/")).toBe("/");
    expect(relativePathname("/parkventory/app", "/parkventory/")).toBe("/app");
  });

  it("présente la promesse et les actions principales sur la landing", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);

    expect(screen.getByRole("heading", { name: /Partagez votre place/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Partager ma place/i })).toHaveAttribute("href", "/app?intent=share");
    expect(screen.getByText("Aucun administrateur requis pour démarrer")).toBeInTheDocument();
  });

  it("rend le dashboard et permet de partager une place", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    window.history.replaceState({}, "", "/app");
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Bonjour, Nicolas/i })).toBeInTheDocument();
    const shareForm = screen.getByRole("form", { name: "Formulaire de partage" });
    const submit = within(shareForm).getByRole("button", { name: "Partager ma place" });
    await user.click(submit);
    expect(await screen.findByRole("status")).toHaveTextContent(/partagée dans cette démo locale/i);
  });

  it("refuse une adresse personnelle sur le formulaire d’invitation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    window.history.replaceState({}, "", "/app");
    const user = userEvent.setup();
    render(<App />);

    const input = await screen.findByLabelText("Adresse e-mail professionnelle");
    await user.type(input, "nicolas@gmail.com");
    await user.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(screen.getByText("Saisissez une adresse professionnelle valide.")).toBeInTheDocument();
  });
});
