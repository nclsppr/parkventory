import { describe, expect, it } from "vitest";
import {
  adminTenantSeoMetadata,
  alternateLinks,
  defaultLocale,
  legacyAdminTenantIdFromPathname,
  legacyRouteFromPathname,
  localeConfig,
  localeFromLanguagePreferences,
  localeFromLanguageTag,
  localeFromPathname,
  localizedManifestPath,
  localizedAdminTenantPath,
  localizedAdminTenantRouteFromPathname,
  localizedPath,
  localizedRouteFromPathname,
  localizedRoutePaths,
  publicRouteIds,
  seoMetadata,
  siteOrigin,
  socialImageUrl,
  supportedLocales,
  type Locale,
  type RouteId,
} from "../../shared/i18n";

type LocalizedRouteId = Exclude<RouteId, "notFound">;

const localizedRouteIds: readonly LocalizedRouteId[] = [
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
];

const expectedPaths = {
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
} as const satisfies Record<Locale, Record<LocalizedRouteId, string>>;

const xDefaultPaths = {
  home: "/",
  privacy: "/privacy",
  legal: "/legal",
} as const;

const expectedSocialImageAlts = {
  fr: "Carte sociale Parkventory avec le symbole canonique et un parcours entre une place partagée et une place sélectionnée.",
  en: "Parkventory social card with the canonical symbol and a route between a shared space and a selected space.",
  de: "Parkventory-Vorschau mit dem kanonischen Symbol und einem Weg zwischen einem geteilten und einem ausgewählten Parkplatz.",
  lb: "Parkventory-Virschau mam kanonesche Symbol an engem Wee tëscht enger gedeeltener an enger ausgewielter Parkplaz.",
} as const satisfies Record<Locale, string>;

const publicPageCases = supportedLocales.flatMap((locale) =>
  publicRouteIds.map((route) => ({ locale, route })),
);

const privateRouteIds = [
  "app",
  "share",
  "find",
  "tenantAdmin",
  "adminOverview",
  "adminTenants",
  "adminUsers",
  "adminOperations",
  "authCallback",
] as const;
const privatePageCases = supportedLocales.flatMap((locale) =>
  privateRouteIds.map((route) => ({ locale, route })),
);

describe("détection de la langue", () => {
  it.each([
    ["fr-FR;q=0.4, de-LU;q=0.9, en-GB;q=0.7", "de"],
    ["en-US;q=0.8, fr-LU;q=0.95, de;q=0.6", "fr"],
    ["nl-LU;q=1, lb-LU;q=0.75, de-DE;q=0.5", "lb"],
    ["DE-lu;Q=0.9, en;q=0.2", "de"],
  ] as const)("respecte les qualités de %s", (header, expectedLocale) => {
    expect(localeFromLanguagePreferences(header)).toBe(expectedLocale);
  });

  it("utilise la première langue prise en charge dans l’ordre du navigateur", () => {
    expect(localeFromLanguagePreferences(["nl-LU", "lb-LU", "de-DE"])).toBe("lb");
  });

  it("revient au fallback demandé ou au français par défaut", () => {
    expect(localeFromLanguagePreferences("nl-BE, es-ES;q=0.8")).toBe(defaultLocale);
    expect(localeFromLanguagePreferences("nl-BE, es-ES;q=0.8", "en")).toBe("en");
    expect(localeFromLanguagePreferences("*", "lb")).toBe("lb");
    expect(localeFromLanguagePreferences(null, "de")).toBe("de");
  });

  it("ignore explicitement une langue refusée avec q=0", () => {
    expect(localeFromLanguagePreferences("de-DE;q=0, en-GB;q=0.7", "fr")).toBe("en");
    expect(localeFromLanguagePreferences("de-DE;q=0", "fr")).toBe("fr");
  });

  it("normalise la casse et les variantes régionales", () => {
    expect(localeFromLanguageTag(" LB-lu ")).toBe("lb");
    expect(localeFromLanguageTag("de_LU")).toBe("de");
    expect(localeFromLanguageTag("nl-LU")).toBeNull();
  });
});

describe("routes localisées", () => {
  it("conserve les chemins publics et privés attendus dans les quatre langues", () => {
    expect(localizedRoutePaths).toEqual(expectedPaths);
  });

  it.each(supportedLocales)("fait l’aller-retour de toutes les routes en %s", (locale) => {
    localizedRouteIds.forEach((route) => {
      const pathname = expectedPaths[locale][route];

      expect(localizedPath(locale, route)).toBe(pathname);
      expect(localeFromPathname(pathname)).toBe(locale);
      expect(localizedRouteFromPathname(pathname)).toEqual({ locale, route });
      expect(localizedRouteFromPathname(`${pathname}/`)).toEqual({ locale, route });
    });
  });

  it("refuse les locales et routes inconnues", () => {
    expect(localeFromPathname("/nl/app")).toBeNull();
    expect(localizedRouteFromPathname("/fr/app/inconnue")).toBeNull();
    expect(localizedRouteFromPathname("/lb/confidentialite")).toBeNull();
  });

  it("reconnaît les anciens chemins privés sans les confondre avec un détail tenant", () => {
    expect(legacyRouteFromPathname("/app/admin")).toBe("tenantAdmin");
    expect(legacyRouteFromPathname("/admin")).toBe("adminOverview");
    expect(legacyRouteFromPathname("/admin/tenants")).toBe("adminTenants");
    expect(legacyRouteFromPathname("/admin/users")).toBe("adminUsers");
    expect(legacyRouteFromPathname("/admin/operations")).toBe("adminOperations");
    expect(legacyRouteFromPathname("/admin/tenants/org_acme")).toBeNull();
  });
});

describe("détail admin tenant localisé", () => {
  it.each(supportedLocales)("encode et relit un identifiant sûr en %s", (locale) => {
    const tenantId = "org:acme_2026.08-31";
    const pathname = localizedAdminTenantPath(locale, tenantId);

    expect(pathname).toBe(`${expectedPaths[locale].adminTenants}/org%3Aacme_2026.08-31`);
    expect(localizedAdminTenantRouteFromPathname(pathname)).toEqual({ locale, tenantId });
    expect(localizedAdminTenantRouteFromPathname(`${pathname}/`)).toEqual({ locale, tenantId });
  });

  it("relit le détail historique pour permettre sa redirection", () => {
    expect(legacyAdminTenantIdFromPathname("/admin/tenants/org%3Aacme_2026.08-31"))
      .toBe("org:acme_2026.08-31");
  });

  it.each([
    "",
    ".",
    "..",
    "org/acme",
    "org acme",
    "x".repeat(161),
  ])("refuse l’identifiant non canonique %j dans le builder", (tenantId) => {
    expect(() => localizedAdminTenantPath("fr", tenantId)).toThrow(TypeError);
  });

  it.each([
    "/fr/admin/tenants/%E0%A4%A",
    "/fr/admin/tenants/org%2Facme",
    "/fr/admin/tenants/%2E%2E",
    "/fr/admin/tenants/org_acme/members",
    "/fr-FR/admin/tenants/org_acme",
    "/nl/admin/tenants/org_acme",
  ])("rend null pour un détail invalide afin que le routeur produise une 404: %s", (pathname) => {
    expect(localizedAdminTenantRouteFromPathname(pathname)).toBeNull();
  });

  it("produit une canonique privée exacte sans hreflang", () => {
    const metadata = adminTenantSeoMetadata("de", "org:acme");

    expect(metadata.canonicalUrl).toBe("https://parkventory.com/de/admin/tenants/org%3Aacme");
    expect(metadata.indexable).toBe(false);
    expect(metadata.alternates).toEqual([]);
  });
});

describe("SEO des pages publiques", () => {
  it("couvre exactement les douze combinaisons publiques", () => {
    expect(publicPageCases).toHaveLength(12);
  });

  it.each(publicPageCases)(
    "produit la canonique et les hreflang de $route en $locale",
    ({ locale, route }) => {
      const metadata = seoMetadata(locale, route);
      const expectedAlternates = [
        ...supportedLocales.map((alternateLocale) => ({
          hrefLang: alternateLocale,
          href: `${siteOrigin}${expectedPaths[alternateLocale][route]}`,
        })),
        {
          hrefLang: "x-default" as const,
          href: `${siteOrigin}${xDefaultPaths[route]}`,
        },
      ];

      expect(metadata.indexable).toBe(true);
      expect(metadata.canonicalUrl).toBe(`${siteOrigin}${expectedPaths[locale][route]}`);
      expect(metadata.alternates).toEqual(expectedAlternates);
      expect(alternateLinks(route)).toEqual(expectedAlternates);
      expect(metadata.title.trim()).not.toBe("");
      expect(metadata.description.trim()).not.toBe("");
      expect(metadata.socialImageAlt).toBe(expectedSocialImageAlts[locale]);
      expect(metadata.socialImageAlt).not.toBe(metadata.title);
      expect(metadata.ogLocale).toBe(localeConfig[locale].ogLocale);
      expect(metadata.ogLocaleAlternates).toEqual(
        supportedLocales
          .filter((alternateLocale) => alternateLocale !== locale)
          .map((alternateLocale) => localeConfig[alternateLocale].ogLocale),
      );
      expect(metadata.inLanguage).toBe(localeConfig[locale].intlLocale);
    },
  );
});

describe("SEO des routes non indexables", () => {
  it.each(privatePageCases)(
    "marque $route en $locale comme privée sans hreflang",
    ({ locale, route }) => {
      const metadata = seoMetadata(locale, route);

      expect(metadata.indexable).toBe(false);
      expect(metadata.alternates).toEqual([]);
      expect(metadata.canonicalUrl).toBe(`${siteOrigin}${expectedPaths[locale][route]}`);
    },
  );

  it.each(supportedLocales)("marque la 404 en %s comme non indexable et sans canonique", (locale) => {
    const metadata = seoMetadata(locale, "notFound");

    expect(metadata.indexable).toBe(false);
    expect(metadata.alternates).toEqual([]);
    expect(metadata.canonicalUrl).toBeNull();
  });
});

describe("ressources sociales et manifestes", () => {
  it.each(supportedLocales)("produit des ressources localisées pour %s", (locale) => {
    expect(socialImageUrl(locale)).toBe(`${siteOrigin}/parkventory-social-card-${locale}.png`);
    expect(localizedManifestPath(locale)).toBe(`/manifest-${locale}.webmanifest`);
  });

  it("ne partage aucune ressource entre deux langues", () => {
    expect(new Set(supportedLocales.map(socialImageUrl))).toHaveLength(4);
    expect(new Set(supportedLocales.map(localizedManifestPath))).toHaveLength(4);
    expect(new Set(supportedLocales.map((locale) => seoMetadata(locale, "home").socialImageAlt)))
      .toHaveLength(4);
  });
});
