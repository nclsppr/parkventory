import type { Locale } from "../../../shared/i18n";

export const systemMessages = {
  fr: {
    connectionCheckFailed: "La connexion n’a pas pu être vérifiée.",
    checkingConnection: "Vérification de la connexion…",
    checkingOperator: "Vérification de l’accès opérateur…",
    openingConsole: "Ouverture de la console…",
    loadingConsole: "Chargement du poste de contrôle Parkventory.",
  },
  en: {
    connectionCheckFailed: "Your session could not be verified.",
    checkingConnection: "Checking your session…",
    checkingOperator: "Checking operator access…",
    openingConsole: "Opening the console…",
    loadingConsole: "Loading the Parkventory control station.",
  },
  de: {
    connectionCheckFailed: "Ihre Anmeldung konnte nicht überprüft werden.",
    checkingConnection: "Anmeldung wird überprüft…",
    checkingOperator: "Operatorzugang wird überprüft…",
    openingConsole: "Konsole wird geöffnet…",
    loadingConsole: "Die Parkventory-Betriebskonsole wird geladen.",
  },
  lb: {
    connectionCheckFailed: "Är Umeldung konnt net iwwerpréift ginn.",
    checkingConnection: "Umeldung gëtt iwwerpréift…",
    checkingOperator: "Den Operator-Zougang gëtt iwwerpréift…",
    openingConsole: "D’Konsol gëtt opgemaach…",
    loadingConsole: "De Parkventory-Kontrollberäich gëtt gelueden.",
  },
} as const satisfies Record<Locale, Record<string, string>>;
