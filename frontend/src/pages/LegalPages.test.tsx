import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../App";

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
    expect(screen.getAllByRole("link", { name: "nicolas@pieper.fr" })[0]).toHaveAttribute(
      "href",
      "mailto:nicolas@pieper.fr",
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
