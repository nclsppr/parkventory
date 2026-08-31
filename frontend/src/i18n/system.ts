import type { Locale } from "../../../shared/i18n";

export const systemMessages = {
  fr: {
    connectionCheckFailed: "La connexion n’a pas pu être vérifiée.",
    checkingConnection: "Vérification de la connexion…",
  },
  en: {
    connectionCheckFailed: "Your session could not be verified.",
    checkingConnection: "Checking your session…",
  },
  de: {
    connectionCheckFailed: "Ihre Anmeldung konnte nicht überprüft werden.",
    checkingConnection: "Anmeldung wird überprüft…",
  },
  lb: {
    connectionCheckFailed: "Är Umeldung konnt net iwwerpréift ginn.",
    checkingConnection: "Umeldung gëtt iwwerpréift…",
  },
} as const satisfies Record<Locale, Record<string, string>>;
