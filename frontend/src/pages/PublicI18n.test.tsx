import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { Locale } from "../../../shared/i18n";
import { ThemeProvider } from "../components/Theme";
import { I18nProvider } from "../i18n/I18n";
import { landingMessages } from "../i18n/landing";
import { LandingPage } from "./LandingPage";
import { NotFoundPage } from "./NotFoundPage";

vi.mock("../hooks/useLandingMotion", () => ({
  useLandingMotion: () => undefined,
}));

interface LocaleExpectation {
  locale: Locale;
  path: string;
  heroTitle: string;
  heroAccent: string;
  navigationLabel: string;
  openMenu: string;
  mobileNavigationLabel: string;
  selectLabel: string;
  shareLabel: string;
  shareHref: string;
  findLabel: string;
  findHref: string;
  previewGreeting: string;
  confirmation: string;
  notFoundPath: string;
  notFoundTitle: string;
  notFoundBody: string;
  backHomeLabel: string;
  homeHref: string;
}

const localeExpectations: readonly LocaleExpectation[] = [
  {
    locale: "fr",
    path: "/fr/",
    heroTitle: "Partagez votre place.",
    heroAccent: "Gagnez du temps.",
    navigationLabel: "Navigation principale",
    openMenu: "Ouvrir le menu",
    mobileNavigationLabel: "Navigation mobile",
    selectLabel: "Choisir la langue",
    shareLabel: "Partager ma place",
    shareHref: "/fr/app/partager",
    findLabel: "Voir les disponibilités",
    findHref: "/fr/app/trouver",
    previewGreeting: "Bonjour, Nicolas",
    confirmation: "La réservation est confirmée, sans échange manuel à organiser.",
    notFoundPath: "/fr/introuvable",
    notFoundTitle: "Cette place n’existe pas.",
    notFoundBody: "Le lien demandé ne correspond à aucune page Parkventory.",
    backHomeLabel: "Revenir à l’accueil",
    homeHref: "/fr/",
  },
  {
    locale: "en",
    path: "/en/",
    heroTitle: "Share your space.",
    heroAccent: "Save time.",
    navigationLabel: "Main navigation",
    openMenu: "Open menu",
    mobileNavigationLabel: "Mobile navigation",
    selectLabel: "Choose language",
    shareLabel: "Share my space",
    shareHref: "/en/app/share",
    findLabel: "View availability",
    findHref: "/en/app/find",
    previewGreeting: "Hello, Nicolas",
    confirmation: "The booking is confirmed, with nothing to coordinate manually.",
    notFoundPath: "/en/missing",
    notFoundTitle: "This space doesn’t exist.",
    notFoundBody: "The requested link doesn’t match any Parkventory page.",
    backHomeLabel: "Back to home",
    homeHref: "/en/",
  },
  {
    locale: "de",
    path: "/de/",
    heroTitle: "Teilen Sie Ihren Parkplatz.",
    heroAccent: "Sparen Sie Zeit.",
    navigationLabel: "Hauptnavigation",
    openMenu: "Menü öffnen",
    mobileNavigationLabel: "Mobile Navigation",
    selectLabel: "Sprache auswählen",
    shareLabel: "Meinen Parkplatz teilen",
    shareHref: "/de/app/teilen",
    findLabel: "Verfügbare Plätze anzeigen",
    findHref: "/de/app/suchen",
    previewGreeting: "Hallo, Nicolas",
    confirmation: "Die Reservierung wird bestätigt, ohne dass etwas manuell abgestimmt werden muss.",
    notFoundPath: "/de/fehlt",
    notFoundTitle: "Diesen Parkplatz gibt es nicht.",
    notFoundBody: "Der aufgerufene Link gehört zu keiner Parkventory-Seite.",
    backHomeLabel: "Zurück zur Startseite",
    homeHref: "/de/",
  },
  {
    locale: "lb",
    path: "/lb/",
    heroTitle: "Deelt Är Parkplaz.",
    heroAccent: "Spuert Zäit.",
    navigationLabel: "Haaptnavigatioun",
    openMenu: "Menü opmaachen",
    mobileNavigationLabel: "Mobil Navigatioun",
    selectLabel: "Sprooch auswielen",
    shareLabel: "Meng Parkplaz deelen",
    shareHref: "/lb/app/deelen",
    findLabel: "Disponibilitéite kucken",
    findHref: "/lb/app/fannen",
    previewGreeting: "Moien, Nicolas",
    confirmation: "D’Reservatioun gëtt confirméiert, ouni eppes manuell ofstëmmen ze mussen.",
    notFoundPath: "/lb/net-fonnt",
    notFoundTitle: "Dës Parkplaz gëtt et net.",
    notFoundBody: "De gefrote Link entsprécht kenger Parkventory-Säit.",
    backHomeLabel: "Zréck op d’Startsäit",
    homeHref: "/lb/",
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

function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shapeOf);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, entry]) => [key, shapeOf(entry)]),
    );
  }
  return typeof value;
}

function stringsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(stringsOf);
  }
  return [];
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("style");
  window.history.replaceState({}, "", "/");
});

describe("catalogue public multilingue", () => {
  it("conserve exactement la même structure et des valeurs renseignées dans les quatre langues", () => {
    const frenchShape = shapeOf(landingMessages.fr);

    localeExpectations.forEach(({ locale }) => {
      expect(shapeOf(landingMessages[locale])).toEqual(frenchShape);
      expect(stringsOf(landingMessages[locale])).not.toContain("");
      stringsOf(landingMessages[locale]).forEach((value) => {
        expect(value.trim()).not.toBe("");
      });
    });
  });

  it("ne contient plus la promesse de notification hors MVP", () => {
    const catalogue = stringsOf(landingMessages).join("\n");

    expect(catalogue).not.toMatch(/Vous êtes informé/i);
    expect(catalogue).not.toMatch(/You are informed/i);
    expect(catalogue).not.toMatch(/Sie werden informiert/i);
    expect(catalogue).not.toMatch(/Dir gitt informéiert/i);
    localeExpectations.forEach(({ confirmation }) => {
      expect(catalogue).toContain(confirmation);
    });
  });
});

describe.each(localeExpectations)("pages publiques en $locale", (expectation) => {
  it("localise la landing, ses libellés accessibles, son aperçu et ses CTA", () => {
    renderAt(expectation.path, <LandingPage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(expectation.heroTitle);
    expect(heading).toHaveTextContent(expectation.heroAccent);
    expect(screen.getByRole("navigation", { name: expectation.navigationLabel })).toBeInTheDocument();
    expect(screen.getByLabelText(expectation.selectLabel)).toHaveValue(expectation.locale);
    expect(screen.getByRole("link", { name: expectation.shareLabel })).toHaveAttribute("href", expectation.shareHref);
    expect(screen.getByRole("link", { name: expectation.findLabel })).toHaveAttribute("href", expectation.findHref);
    expect(screen.getByText(expectation.previewGreeting)).toBeInTheDocument();
    expect(screen.getByText(expectation.confirmation)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: expectation.openMenu }));
    expect(screen.getByRole("navigation", { name: expectation.mobileNavigationLabel })).toBeInTheDocument();
    expect(screen.getAllByLabelText(expectation.selectLabel)).toHaveLength(2);
  });

  it("localise la page 404 et son retour vers l’accueil de la même langue", () => {
    renderAt(expectation.notFoundPath, <NotFoundPage />);

    expect(document.documentElement).toHaveAttribute("lang", expectation.locale);
    expect(screen.getByRole("heading", { name: expectation.notFoundTitle })).toBeInTheDocument();
    expect(screen.getByText(expectation.notFoundBody)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: expectation.backHomeLabel })).toHaveAttribute("href", expectation.homeHref);
  });
});

describe("sélecteur de langue public", () => {
  it("change la route courante et les CTA vers leur équivalent localisé", () => {
    renderAt("/fr/", <LandingPage />);

    fireEvent.change(screen.getByLabelText("Choisir la langue"), {
      target: { value: "de" },
    });

    expect(window.location.pathname).toBe("/de/");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Teilen Sie Ihren Parkplatz.");
    expect(screen.getByRole("link", { name: "Meinen Parkplatz teilen" })).toHaveAttribute("href", "/de/app/teilen");
    expect(screen.getByRole("link", { name: "Verfügbare Plätze anzeigen" })).toHaveAttribute("href", "/de/app/suchen");
  });
});
