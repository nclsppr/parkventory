import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Locale } from "../../../shared/i18n";
import { publicContactEmail } from "../../../shared/site";
import { ThemeProvider } from "../components/Theme";
import { I18nProvider } from "../i18n/I18n";
import { LegalNoticePage, PrivacyPage } from "./LegalPages";

const testContactEmail = publicContactEmail;

interface LegalExpectation {
  locale: Locale;
  privacyPath: string;
  legalPath: string;
  homePath: string;
  privacyTitle: string;
  legalTitle: string;
  brandHomeLabel: string;
  backHomeLabel: string;
  privacyLinkLabel: string;
  legalLinkLabel: string;
  selectLabel: string;
}

const legalExpectations: readonly LegalExpectation[] = [
  {
    locale: "fr",
    privacyPath: "/fr/confidentialite",
    legalPath: "/fr/mentions-legales",
    homePath: "/fr/",
    privacyTitle: "Confidentialité",
    legalTitle: "Mentions légales",
    brandHomeLabel: "Revenir à l’accueil Parkventory",
    backHomeLabel: "Accueil",
    privacyLinkLabel: "Confidentialité",
    legalLinkLabel: "Mentions légales",
    selectLabel: "Choisir la langue",
  },
  {
    locale: "en",
    privacyPath: "/en/privacy",
    legalPath: "/en/legal-notice",
    homePath: "/en/",
    privacyTitle: "Privacy",
    legalTitle: "Legal notice",
    brandHomeLabel: "Return to the Parkventory home page",
    backHomeLabel: "Home",
    privacyLinkLabel: "Privacy",
    legalLinkLabel: "Legal notice",
    selectLabel: "Choose language",
  },
  {
    locale: "de",
    privacyPath: "/de/datenschutz",
    legalPath: "/de/impressum",
    homePath: "/de/",
    privacyTitle: "Datenschutz",
    legalTitle: "Impressum",
    brandHomeLabel: "Zur Parkventory-Startseite zurückkehren",
    backHomeLabel: "Startseite",
    privacyLinkLabel: "Datenschutz",
    legalLinkLabel: "Impressum",
    selectLabel: "Sprache auswählen",
  },
  {
    locale: "lb",
    privacyPath: "/lb/dateschutz",
    legalPath: "/lb/impressum",
    homePath: "/lb/",
    privacyTitle: "Dateschutz",
    legalTitle: "Impressum",
    brandHomeLabel: "Zréck op d’Parkventory-Startsäit",
    backHomeLabel: "Startsäit",
    privacyLinkLabel: "Dateschutz",
    legalLinkLabel: "Impressum",
    selectLabel: "Sprooch auswielen",
  },
];

function renderAt(path: string, element: ReactElement) {
  window.history.replaceState({}, "", path);
  return render(
    <I18nProvider>
      <ThemeProvider>{element}</ThemeProvider>
    </I18nProvider>,
  );
}

function expectNoOrganizationBranding(container: HTMLElement) {
  expect(container.querySelector(".organization-brand-scope")).not.toBeInTheDocument();
  expect(container.querySelector(".organization-logo")).not.toBeInTheDocument();
  expect(container.querySelector("[data-organization-branding]")).not.toBeInTheDocument();
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("style");
  window.history.replaceState({}, "", "/");
});

describe.each(legalExpectations)("pages légales en $locale", (expectation) => {
  it("rend la confidentialité avec accueil, notice croisée et sélecteur localisés", () => {
    const { container } = renderAt(expectation.privacyPath, <PrivacyPage />);

    expect(document.documentElement).toHaveAttribute("lang", expectation.locale);
    expect(screen.getByRole("heading", { name: expectation.privacyTitle, level: 1 }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: expectation.brandHomeLabel }))
      .toHaveAttribute("href", expectation.homePath);
    expect(screen.getByRole("link", { name: expectation.backHomeLabel }))
      .toHaveAttribute("href", expectation.homePath);
    expect(screen.getByRole("link", { name: expectation.legalLinkLabel }))
      .toHaveAttribute("href", expectation.legalPath);
    expect(screen.getByLabelText(expectation.selectLabel)).toHaveValue(expectation.locale);
    expect(screen.getAllByRole("link", { name: testContactEmail })[0])
      .toHaveAttribute("href", `mailto:${testContactEmail}`);
    expectNoOrganizationBranding(container);
  });

  it("rend la notice avec accueil, confidentialité croisée et sélecteur localisés", () => {
    const { container } = renderAt(expectation.legalPath, <LegalNoticePage />);

    expect(document.documentElement).toHaveAttribute("lang", expectation.locale);
    expect(screen.getByRole("heading", { name: expectation.legalTitle, level: 1 }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: expectation.brandHomeLabel }))
      .toHaveAttribute("href", expectation.homePath);
    expect(screen.getByRole("link", { name: expectation.backHomeLabel }))
      .toHaveAttribute("href", expectation.homePath);
    expect(screen.getByRole("link", { name: expectation.privacyLinkLabel }))
      .toHaveAttribute("href", expectation.privacyPath);
    expect(screen.getByLabelText(expectation.selectLabel)).toHaveValue(expectation.locale);
    expect(screen.getByText("Nicolas Pieper")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cloudflare\.com/i }))
      .toHaveAttribute("href", "https://www.cloudflare.com/");
    expectNoOrganizationBranding(container);
  });
});
