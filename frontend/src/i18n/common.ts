import type { Locale } from "../../../shared/i18n";

export const commonMessages = {
  fr: {
    language: "Langue",
    chooseLanguage: "Choisir la langue",
    appearance: "Apparence",
    lightTheme: "Thème clair",
    darkTheme: "Thème sombre",
    skipToContent: "Aller au contenu",
    retry: "Réessayer",
    closeNotification: "Fermer la notification",
    securityUnavailable: "La vérification de sécurité est indisponible. Réessayez plus tard.",
  },
  en: {
    language: "Language",
    chooseLanguage: "Choose language",
    appearance: "Appearance",
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
    skipToContent: "Skip to content",
    retry: "Try again",
    closeNotification: "Close notification",
    securityUnavailable: "Security verification is unavailable. Please try again later.",
  },
  de: {
    language: "Sprache",
    chooseLanguage: "Sprache auswählen",
    appearance: "Darstellung",
    lightTheme: "Helles Design",
    darkTheme: "Dunkles Design",
    skipToContent: "Zum Inhalt springen",
    retry: "Erneut versuchen",
    closeNotification: "Benachrichtigung schließen",
    securityUnavailable: "Die Sicherheitsprüfung ist nicht verfügbar. Versuchen Sie es später erneut.",
  },
  lb: {
    language: "Sprooch",
    chooseLanguage: "Sprooch auswielen",
    appearance: "Ausgesinn",
    lightTheme: "Hellt Design",
    darkTheme: "Däischtert Design",
    skipToContent: "Bei den Inhalt sprangen",
    retry: "Nach eng Kéier probéieren",
    closeNotification: "Notifikatioun zoumaachen",
    securityUnavailable: "D'Sécherheetskontroll ass net disponibel. Probéiert et méi spéit nach eng Kéier.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

