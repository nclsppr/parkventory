import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import styles from "../styles.css?raw";
import type { OrganizationBranding } from "../types";
import {
  ApplicationBrand,
  OrganizationBrandingProvider,
} from "./OrganizationBranding";

const branding: OrganizationBranding = {
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

afterEach(cleanup);

type Rgb = readonly [number, number, number];

function luminance(hex: string) {
  const channels = [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as unknown as Rgb;
  const linear = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("branding d’organisation", () => {
  it("scope les jetons et compose les deux marques sans les fusionner", () => {
    const { container } = render(
      <OrganizationBrandingProvider branding={branding}>
        <ApplicationBrand />
      </OrganizationBrandingProvider>,
    );

    expect(screen.getByRole("img", { name: "Victor Buck Services, avec Parkventory" })).toBeInTheDocument();
    expect(container.querySelector("img.organization-logo")).toHaveAttribute("src", branding.logoUrl);
    expect(container.querySelector(".organization-parkventory-badge img")).toHaveAttribute(
      "src",
      "/parkventory-logo-transparent.svg",
    );

    const scope = container.querySelector<HTMLElement>(".organization-brand-scope");
    expect(scope?.style.getPropertyValue("--organization-action-fill")).toBe("#0D92D2");
    expect(scope?.style.getPropertyValue("--organization-on-action")).toBe("#030504");
    expect(scope?.style.getPropertyValue("--organization-available-fill")).toBe("#E31C79");
    expect(scope?.style.getPropertyValue("--organization-highlight")).toBe("#E31C79");
  });

  it("échoue fermé sur une URL externe ou une couleur invalide", () => {
    const { container, rerender } = render(
      <OrganizationBrandingProvider branding={{ ...branding, logoUrl: "https://example.com/logo.svg" }}>
        <ApplicationBrand />
      </OrganizationBrandingProvider>,
    );
    expect(screen.getByText("Parkventory")).toBeInTheDocument();
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();

    rerender(
      <OrganizationBrandingProvider branding={{
        ...branding,
        colors: { ...branding.colors, actionFill: "blue" },
      }}>
        <ApplicationBrand />
      </OrganizationBrandingProvider>,
    );
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
    expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
  });

  it("échoue fermé sans planter sur un payload partiel", () => {
    const partialBranding = { enabled: true } as unknown as OrganizationBranding;
    const { container } = render(
      <OrganizationBrandingProvider branding={partialBranding}>
        <ApplicationBrand />
      </OrganizationBrandingProvider>,
    );

    expect(screen.getByText("Parkventory")).toBeInTheDocument();
    expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
  });

  it("revient au logo Parkventory si l’asset entreprise ne charge pas", () => {
    const { container } = render(
      <OrganizationBrandingProvider branding={branding}>
        <ApplicationBrand />
      </OrganizationBrandingProvider>,
    );

    fireEvent.error(container.querySelector("img.organization-logo") as HTMLImageElement);
    expect(screen.getByText("Parkventory")).toBeInTheDocument();
    expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
    expect(container.querySelector(".organization-brand-scope")).toBeInTheDocument();
  });

  it("mappe des encres distinctes pour les thèmes sombre et clair", () => {
    expect(styles).toMatch(/\.organization-brand-scope\s*\{[\s\S]*?--green: var\(--organization-dark-action-ink\);/);
    expect(styles).toMatch(/\.organization-brand-scope\s*\{[\s\S]*?--cyan: var\(--organization-dark-available-ink\);/);
    expect(styles).toMatch(/:root\[data-theme="light"\] \.organization-brand-scope\s*\{[\s\S]*?--green: var\(--organization-light-action-ink\);/);
    expect(styles).toMatch(/:root\[data-theme="light"\] \.organization-brand-scope\s*\{[\s\S]*?--cyan: var\(--organization-light-available-ink\);/);
  });

  it("garde les couples textuels AA pour le bleu et le magenta", () => {
    const pairs: ReadonlyArray<readonly [string, string]> = [
      [branding.colors.onAction, branding.colors.actionFill],
      [branding.colors.onAvailable, branding.colors.availableFill],
      [branding.colors.dark.actionInk, "#030504"],
      [branding.colors.dark.availableInk, "#030504"],
      [branding.colors.light.actionInk, "#F4F6F1"],
      [branding.colors.light.availableInk, "#F4F6F1"],
    ];
    pairs.forEach(([foreground, background]) => {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });
    expect(contrast(branding.colors.highlight, "#F4F6F1")).toBeGreaterThanOrEqual(3);
    expect(styles).toMatch(/\.organization-brand-scope \.app-sidebar\s*\{\s*box-shadow: inset 0 3px var\(--company-highlight\);/);
  });
});
