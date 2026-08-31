export const supportedLocales = ["fr", "en", "de", "lb"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "fr";
export const localeCookieName = "parkventory_locale";
export const siteOrigin = "https://parkventory.com";

export const localeConfig: Record<Locale, {
  htmlLang: string;
  intlLocale: string;
  label: string;
  ogLocale: string;
}> = {
  fr: { htmlLang: "fr", intlLocale: "fr-LU", label: "Français", ogLocale: "fr_LU" },
  en: { htmlLang: "en", intlLocale: "en-GB", label: "English", ogLocale: "en_GB" },
  de: { htmlLang: "de", intlLocale: "de-LU", label: "Deutsch", ogLocale: "de_LU" },
  lb: { htmlLang: "lb", intlLocale: "lb-LU", label: "Lëtzebuergesch", ogLocale: "lb_LU" },
};

export const routeIds = [
  "home",
  "app",
  "share",
  "find",
  "tenantAdmin",
  "adminOverview",
  "adminTenants",
  "adminUsers",
  "adminOperations",
  "authCallback",
  "privacy",
  "legal",
  "notFound",
] as const;

export type RouteId = (typeof routeIds)[number];
export type PublicRouteId = "home" | "privacy" | "legal";

export const publicRouteIds: readonly PublicRouteId[] = ["home", "privacy", "legal"];

type LocalizedRoutePaths = Record<Exclude<RouteId, "notFound">, string>;

export const localizedRoutePaths: Record<Locale, LocalizedRoutePaths> = {
  fr: {
    home: "/fr/",
    app: "/fr/app",
    share: "/fr/app/partager",
    find: "/fr/app/trouver",
    tenantAdmin: "/fr/app/admin",
    adminOverview: "/fr/admin",
    adminTenants: "/fr/admin/tenants",
    adminUsers: "/fr/admin/users",
    adminOperations: "/fr/admin/operations",
    authCallback: "/fr/auth/callback",
    privacy: "/fr/confidentialite",
    legal: "/fr/mentions-legales",
  },
  en: {
    home: "/en/",
    app: "/en/app",
    share: "/en/app/share",
    find: "/en/app/find",
    tenantAdmin: "/en/app/admin",
    adminOverview: "/en/admin",
    adminTenants: "/en/admin/tenants",
    adminUsers: "/en/admin/users",
    adminOperations: "/en/admin/operations",
    authCallback: "/en/auth/callback",
    privacy: "/en/privacy",
    legal: "/en/legal-notice",
  },
  de: {
    home: "/de/",
    app: "/de/app",
    share: "/de/app/teilen",
    find: "/de/app/suchen",
    tenantAdmin: "/de/app/admin",
    adminOverview: "/de/admin",
    adminTenants: "/de/admin/tenants",
    adminUsers: "/de/admin/users",
    adminOperations: "/de/admin/operations",
    authCallback: "/de/auth/callback",
    privacy: "/de/datenschutz",
    legal: "/de/impressum",
  },
  lb: {
    home: "/lb/",
    app: "/lb/app",
    share: "/lb/app/deelen",
    find: "/lb/app/fannen",
    tenantAdmin: "/lb/app/admin",
    adminOverview: "/lb/admin",
    adminTenants: "/lb/admin/tenants",
    adminUsers: "/lb/admin/users",
    adminOperations: "/lb/admin/operations",
    authCallback: "/lb/auth/callback",
    privacy: "/lb/dateschutz",
    legal: "/lb/impressum",
  },
};

const legacyRoutes: Record<string, Exclude<RouteId, "notFound">> = {
  "/": "home",
  "/app": "app",
  "/app/partager": "share",
  "/app/trouver": "find",
  "/app/admin": "tenantAdmin",
  "/admin": "adminOverview",
  "/admin/tenants": "adminTenants",
  "/admin/users": "adminUsers",
  "/admin/operations": "adminOperations",
  "/auth/callback": "authCallback",
  "/confidentialite": "privacy",
  "/mentions-legales": "legal",
};

function normalizedPathname(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash === "/" ? "/" : withLeadingSlash.replace(/\/+$/, "");
}

const adminTenantIdPattern = /^[A-Za-z0-9._:-]{1,160}$/;

function validAdminTenantId(tenantId: string): boolean {
  return adminTenantIdPattern.test(tenantId) && tenantId !== "." && tenantId !== "..";
}

function decodedAdminTenantId(segment: string): string | null {
  try {
    const tenantId = decodeURIComponent(segment);
    return validAdminTenantId(tenantId) ? tenantId : null;
  } catch {
    return null;
  }
}

function adminTenantIdFromBasePath(pathname: string, basePath: string): string | null {
  const normalized = normalizedPathname(pathname);
  const prefix = `${basePath}/`;
  if (!normalized.startsWith(prefix)) return null;
  const segment = normalized.slice(prefix.length);
  if (!segment || segment.includes("/")) return null;
  return decodedAdminTenantId(segment);
}

const localizedRouteEntries = supportedLocales.flatMap((locale) =>
  Object.entries(localizedRoutePaths[locale]).map(([route, pathname]) => [
    normalizedPathname(pathname),
    { locale, route: route as Exclude<RouteId, "notFound"> },
  ] as const),
);

const localizedRouteIndex = new Map(localizedRouteEntries);

export function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function localeFromLanguageTag(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const language = value.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(language) ? language : null;
}

export function localeFromLanguagePreferences(
  values: readonly string[] | string | null | undefined,
  fallback: Locale = defaultLocale,
): Locale {
  if (!values) return fallback;
  const candidates: readonly string[] = typeof values === "string"
    ? values
      .split(",")
      .map((entry, index) => {
        const trimmed = entry.trim();
        const match = trimmed.match(/(?:^|;)\s*q=([0-9.]+)(?:;|$)/i);
        const parsedQuality = match ? Number(match[1]) : 1;
        const quality = Number.isFinite(parsedQuality)
          ? Math.min(1, Math.max(0, parsedQuality))
          : 1;
        return { index, quality, value: trimmed };
      })
      .filter((entry) => entry.quality > 0)
      .sort((first, second) => second.quality - first.quality || first.index - second.index)
      .map((entry) => entry.value)
    : values;

  for (const candidate of candidates) {
    const locale = localeFromLanguageTag(candidate.split(";")[0]);
    if (locale) return locale;
  }
  return fallback;
}

export function localeFromPathname(pathname: string): Locale | null {
  return localeFromLanguageTag(normalizedPathname(pathname).split("/")[1]);
}

export function localizedRouteFromPathname(pathname: string): {
  locale: Locale;
  route: Exclude<RouteId, "notFound">;
} | null {
  return localizedRouteIndex.get(normalizedPathname(pathname)) ?? null;
}

export function legacyRouteFromPathname(pathname: string): Exclude<RouteId, "notFound"> | null {
  return legacyRoutes[normalizedPathname(pathname)] ?? null;
}

export function localizedPath(
  locale: Locale,
  route: Exclude<RouteId, "notFound">,
): string {
  return localizedRoutePaths[locale][route];
}

export function localizedAdminTenantPath(locale: Locale, tenantId: string): string {
  if (!validAdminTenantId(tenantId)) {
    throw new TypeError("tenantId must be a valid Parkventory identifier");
  }
  return `${localizedPath(locale, "adminTenants")}/${encodeURIComponent(tenantId)}`;
}

export function localizedAdminTenantRouteFromPathname(pathname: string): {
  locale: Locale;
  tenantId: string;
} | null {
  for (const locale of supportedLocales) {
    const tenantId = adminTenantIdFromBasePath(
      pathname,
      localizedPath(locale, "adminTenants"),
    );
    if (tenantId) return { locale, tenantId };
  }
  return null;
}

export function legacyAdminTenantIdFromPathname(pathname: string): string | null {
  return adminTenantIdFromBasePath(pathname, "/admin/tenants");
}

export function isPublicRoute(route: RouteId): route is PublicRouteId {
  return publicRouteIds.includes(route as PublicRouteId);
}

type SeoCopy = Record<RouteId, { title: string; description: string }>;

const seoCopy = {
  fr: {
    home: {
      title: "Parkventory — Le parking partagé, simplement",
      description: "Partagez et réservez les places de parking disponibles entre collègues, simplement et sans double attribution.",
    },
    app: {
      title: "Accueil — Parkventory",
      description: "Application Parkventory privée de votre organisation pour gérer vos partages et réservations de parking.",
    },
    share: {
      title: "Partager ma place — Parkventory",
      description: "Application Parkventory privée de votre organisation pour publier les créneaux où votre place est disponible.",
    },
    find: {
      title: "Trouver une place — Parkventory",
      description: "Application Parkventory privée de votre organisation pour trouver et réserver une place disponible.",
    },
    tenantAdmin: {
      title: "Administration de l’organisation — Parkventory",
      description: "Espace Parkventory privé réservé aux administrateurs de l’organisation pour gérer ses membres et sa personnalisation.",
    },
    adminOverview: {
      title: "Vue d’ensemble — Administration Parkventory",
      description: "Console privée d’exploitation Parkventory pour superviser les organisations et leur activité.",
    },
    adminTenants: {
      title: "Organisations — Administration Parkventory",
      description: "Console privée Parkventory pour consulter les organisations clientes.",
    },
    adminUsers: {
      title: "Utilisateurs — Administration Parkventory",
      description: "Console privée Parkventory pour consulter les comptes utilisateurs.",
    },
    adminOperations: {
      title: "Opérations — Administration Parkventory",
      description: "Console privée Parkventory pour suivre l’activité, les diagnostics et les incidents.",
    },
    authCallback: {
      title: "Connexion — Parkventory",
      description: "Validation sécurisée de votre lien de connexion Parkventory.",
    },
    privacy: {
      title: "Confidentialité — Parkventory",
      description: "Découvrez quelles données Parkventory utilise pour partager et réserver des places entre collègues, et comment exercer vos droits.",
    },
    legal: {
      title: "Mentions légales — Parkventory",
      description: "Consultez les informations légales, l’éditeur, l’hébergement et les conditions de disponibilité de la bêta Parkventory.",
    },
    notFound: {
      title: "Page introuvable — Parkventory",
      description: "Cette page Parkventory n’existe pas ou a été déplacée.",
    },
  },
  en: {
    home: {
      title: "Parkventory — Shared parking, made simple",
      description: "Share and book available workplace parking spaces with colleagues, simply and without double bookings.",
    },
    app: {
      title: "Home — Parkventory",
      description: "Your organisation’s private Parkventory application for managing parking shares and bookings.",
    },
    share: {
      title: "Share my space — Parkventory",
      description: "Your organisation’s private Parkventory application for publishing when your parking space is available.",
    },
    find: {
      title: "Find a space — Parkventory",
      description: "Your organisation’s private Parkventory application for finding and booking an available parking space.",
    },
    tenantAdmin: {
      title: "Organisation administration — Parkventory",
      description: "A private Parkventory area for organisation administrators to manage members and customisation.",
    },
    adminOverview: {
      title: "Overview — Parkventory administration",
      description: "Parkventory’s private operations console for monitoring organisations and their activity.",
    },
    adminTenants: {
      title: "Organisations — Parkventory administration",
      description: "Parkventory’s private console for viewing customer organisations.",
    },
    adminUsers: {
      title: "Users — Parkventory administration",
      description: "Parkventory’s private console for viewing user accounts.",
    },
    adminOperations: {
      title: "Operations — Parkventory administration",
      description: "Parkventory’s private console for monitoring activity, diagnostics and incidents.",
    },
    authCallback: {
      title: "Sign in — Parkventory",
      description: "Secure validation of your Parkventory sign-in link.",
    },
    privacy: {
      title: "Privacy — Parkventory",
      description: "Learn which data Parkventory uses to share and book spaces between colleagues, and how to exercise your rights.",
    },
    legal: {
      title: "Legal notice — Parkventory",
      description: "Read Parkventory’s publisher, hosting and public beta availability information.",
    },
    notFound: {
      title: "Page not found — Parkventory",
      description: "This Parkventory page does not exist or has moved.",
    },
  },
  de: {
    home: {
      title: "Parkventory — Parkplatz teilen, ganz einfach",
      description: "Teilen und buchen Sie verfügbare Firmenparkplätze mit Kolleginnen und Kollegen – einfach und ohne Doppelbuchungen.",
    },
    app: {
      title: "Start — Parkventory",
      description: "Die private Parkventory-Anwendung Ihrer Organisation zur Verwaltung geteilter Parkplätze und Reservierungen.",
    },
    share: {
      title: "Meinen Parkplatz teilen — Parkventory",
      description: "Die private Parkventory-Anwendung Ihrer Organisation, um die Verfügbarkeit Ihres Parkplatzes zu veröffentlichen.",
    },
    find: {
      title: "Parkplatz finden — Parkventory",
      description: "Die private Parkventory-Anwendung Ihrer Organisation, um einen verfügbaren Parkplatz zu finden und zu reservieren.",
    },
    tenantAdmin: {
      title: "Organisationsverwaltung — Parkventory",
      description: "Ein privater Parkventory-Bereich für die Verwaltung von Mitgliedern und Anpassungen Ihrer Organisation.",
    },
    adminOverview: {
      title: "Übersicht — Parkventory-Administration",
      description: "Die private Parkventory-Betriebskonsole zur Überwachung von Organisationen und deren Aktivitäten.",
    },
    adminTenants: {
      title: "Organisationen — Parkventory-Administration",
      description: "Die private Parkventory-Konsole zur Ansicht von Kundenorganisationen.",
    },
    adminUsers: {
      title: "Benutzer — Parkventory-Administration",
      description: "Die private Parkventory-Konsole zur Ansicht von Benutzerkonten.",
    },
    adminOperations: {
      title: "Betrieb — Parkventory-Administration",
      description: "Die private Parkventory-Konsole zur Überwachung von Aktivitäten, Diagnosen und Vorfällen.",
    },
    authCallback: {
      title: "Anmeldung — Parkventory",
      description: "Sichere Bestätigung Ihres Parkventory-Anmeldelinks.",
    },
    privacy: {
      title: "Datenschutz — Parkventory",
      description: "Erfahren Sie, welche Daten Parkventory für das Teilen und Reservieren von Parkplätzen verwendet und wie Sie Ihre Rechte ausüben.",
    },
    legal: {
      title: "Impressum — Parkventory",
      description: "Informationen zu Anbieter, Hosting und Verfügbarkeit der öffentlichen Parkventory-Beta.",
    },
    notFound: {
      title: "Seite nicht gefunden — Parkventory",
      description: "Diese Parkventory-Seite existiert nicht oder wurde verschoben.",
    },
  },
  lb: {
    home: {
      title: "Parkventory — Parkplazen deelen, ganz einfach",
      description: "Deelt a reservéiert fräi Parkplaze mat Äre Kolleegen – einfach an ouni duebel Reservatioun.",
    },
    app: {
      title: "Start — Parkventory",
      description: "Déi privat Parkventory-Applikatioun vun Ärer Organisatioun fir gedeelt Parkplazen a Reservatiounen ze verwalten.",
    },
    share: {
      title: "Meng Parkplaz deelen — Parkventory",
      description: "Déi privat Parkventory-Applikatioun vun Ärer Organisatioun, fir d'Disponibilitéit vun Ärer Parkplaz ze publizéieren.",
    },
    find: {
      title: "Eng Parkplaz fannen — Parkventory",
      description: "Déi privat Parkventory-Applikatioun vun Ärer Organisatioun, fir eng fräi Parkplaz ze fannen an ze reservéieren.",
    },
    tenantAdmin: {
      title: "Administratioun vun der Organisatioun — Parkventory",
      description: "E private Parkventory-Beräich fir Administrateure vun der Organisatioun, fir Memberen an Upassungen ze verwalten.",
    },
    adminOverview: {
      title: "Iwwersiicht — Parkventory-Administratioun",
      description: "Déi privat Parkventory-Betribskonsol fir Organisatiounen an hir Aktivitéit ze iwwerwaachen.",
    },
    adminTenants: {
      title: "Organisatiounen — Parkventory-Administratioun",
      description: "Déi privat Parkventory-Konsol fir Client-Organisatiounen unzekucken.",
    },
    adminUsers: {
      title: "Benotzer — Parkventory-Administratioun",
      description: "Déi privat Parkventory-Konsol fir Benotzerkonten unzekucken.",
    },
    adminOperations: {
      title: "Operatiounen — Parkventory-Administratioun",
      description: "Déi privat Parkventory-Konsol fir Aktivitéit, Diagnosen an Incidenten ze iwwerwaachen.",
    },
    authCallback: {
      title: "Umellen — Parkventory",
      description: "Sécher Bestätegung vun Ärem Parkventory-Umeldungslink.",
    },
    privacy: {
      title: "Dateschutz — Parkventory",
      description: "Gewuer, wéi eng Donnéeë Parkventory benotzt fir Parkplazen tëscht Kolleegen ze deelen an ze reservéieren, a wéi Dir Är Rechter ausüübt.",
    },
    legal: {
      title: "Impressum — Parkventory",
      description: "Informatiounen iwwer den Editeur, den Hosting an d'Disponibilitéit vun der ëffentlecher Parkventory-Beta.",
    },
    notFound: {
      title: "Säit net fonnt — Parkventory",
      description: "Dës Parkventory-Säit gëtt et net oder si gouf verréckelt.",
    },
  },
} as const satisfies Record<Locale, SeoCopy>;

const adminTenantSeoCopy = {
  fr: {
    title: "Organisation — Administration Parkventory",
    description: "Console privée Parkventory pour consulter cette organisation et ses membres.",
  },
  en: {
    title: "Organisation — Parkventory administration",
    description: "Parkventory’s private console for viewing this organisation and its members.",
  },
  de: {
    title: "Organisation — Parkventory-Administration",
    description: "Die private Parkventory-Konsole zur Ansicht dieser Organisation und ihrer Mitglieder.",
  },
  lb: {
    title: "Organisatioun — Parkventory-Administratioun",
    description: "Déi privat Parkventory-Konsol fir dës Organisatioun an hir Memberen unzekucken.",
  },
} as const satisfies Record<Locale, { title: string; description: string }>;

const socialImageAltCopy = {
  fr: "Carte sociale Parkventory avec le symbole canonique et un parcours entre une place partagée et une place sélectionnée.",
  en: "Parkventory social card with the canonical symbol and a route between a shared space and a selected space.",
  de: "Parkventory-Vorschau mit dem kanonischen Symbol und einem Weg zwischen einem geteilten und einem ausgewählten Parkplatz.",
  lb: "Parkventory-Virschau mam kanonesche Symbol an engem Wee tëscht enger gedeeltener an enger ausgewielter Parkplaz.",
} as const satisfies Record<Locale, string>;

export interface AlternateLink {
  hrefLang: Locale | "x-default";
  href: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
  socialImageAlt: string;
  canonicalUrl: string | null;
  indexable: boolean;
  alternates: AlternateLink[];
  ogLocale: string;
  ogLocaleAlternates: string[];
  inLanguage: string;
}

export function alternateLinks(route: PublicRouteId): AlternateLink[] {
  const xDefaultPath = route === "home" ? "/" : route === "privacy" ? "/privacy" : "/legal";
  return [
    ...supportedLocales.map((locale) => ({
      hrefLang: locale,
      href: `${siteOrigin}${localizedPath(locale, route)}`,
    })),
    { hrefLang: "x-default", href: `${siteOrigin}${xDefaultPath}` },
  ];
}

export function seoMetadata(locale: Locale, route: RouteId): SeoMetadata {
  const copy = seoCopy[locale][route];
  const indexable = isPublicRoute(route);
  const canonicalUrl = route === "notFound"
    ? null
    : `${siteOrigin}${localizedPath(locale, route)}`;
  return {
    ...copy,
    socialImageAlt: socialImageAltCopy[locale],
    canonicalUrl,
    indexable,
    alternates: indexable ? alternateLinks(route) : [],
    ogLocale: localeConfig[locale].ogLocale,
    ogLocaleAlternates: supportedLocales
      .filter((alternate) => alternate !== locale)
      .map((alternate) => localeConfig[alternate].ogLocale),
    inLanguage: localeConfig[locale].intlLocale,
  };
}

export function adminTenantSeoMetadata(locale: Locale, tenantId: string): SeoMetadata {
  return {
    ...adminTenantSeoCopy[locale],
    socialImageAlt: socialImageAltCopy[locale],
    canonicalUrl: `${siteOrigin}${localizedAdminTenantPath(locale, tenantId)}`,
    indexable: false,
    alternates: [],
    ogLocale: localeConfig[locale].ogLocale,
    ogLocaleAlternates: supportedLocales
      .filter((alternate) => alternate !== locale)
      .map((alternate) => localeConfig[alternate].ogLocale),
    inLanguage: localeConfig[locale].intlLocale,
  };
}

export function socialImageUrl(locale: Locale): string {
  return `${siteOrigin}/parkventory-social-card-${locale}.png`;
}

export function localizedManifestPath(locale: Locale): string {
  return `/manifest-${locale}.webmanifest`;
}
