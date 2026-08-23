import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const testContactEmail = "contact@parkventory.test";
let App: typeof import("../App").default;

beforeAll(async () => {
  vi.stubEnv("VITE_CONTACT_EMAIL", testContactEmail);
  App = (await import("../App")).default;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("informations légales", () => {
  it("rend la notice de confidentialité directement et expose un contact joignable", () => {
    window.history.replaceState({}, "", "/confidentialite");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Confidentialité", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Données utilisées avec un compte" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: testContactEmail })[0]).toHaveAttribute(
      "href",
      `mailto:${testContactEmail}`,
    );
    expect(screen.getByRole("link", { name: "Mentions légales" })).toHaveAttribute(
      "href",
      "/mentions-legales",
    );
  });

  it("rend les mentions légales directement avec l’éditeur et l’hébergeur", () => {
    window.history.replaceState({}, "", "/mentions-legales");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Mentions légales", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Nicolas Pieper")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ovhcloud\.com/i })).toHaveAttribute(
      "href",
      "https://www.ovhcloud.com/fr/",
    );
    expect(screen.getByRole("link", { name: "Confidentialité" })).toHaveAttribute(
      "href",
      "/confidentialite",
    );
  });
});
