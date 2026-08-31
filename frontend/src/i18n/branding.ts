import type { Locale } from "../../../shared/i18n";

interface BrandingMessages {
  applicationBrandLabel: (companyName: string) => string;
}

export const brandingMessages = {
  fr: { applicationBrandLabel: (companyName) => `${companyName}, avec Parkventory` },
  en: { applicationBrandLabel: (companyName) => `${companyName}, with Parkventory` },
  de: { applicationBrandLabel: (companyName) => `${companyName}, mit Parkventory` },
  lb: { applicationBrandLabel: (companyName) => `${companyName}, mat Parkventory` },
} satisfies Record<Locale, BrandingMessages>;
