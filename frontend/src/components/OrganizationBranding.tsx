import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { defaultLocale, localeFromLanguageTag } from "../../../shared/i18n";
import { brandingMessages } from "../i18n/branding";
import type { OrganizationBranding } from "../types";
import { Logo, LogoMark } from "./Logo";

const BrandingContext = createContext<OrganizationBranding | null>(null);
const hexColorPattern = /^#[0-9a-f]{6}$/i;
const sameOriginLogoPattern = /^\/(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:avif|png|svg|webp)$/i;
function readDocumentLocale() {
  return localeFromLanguageTag(document.documentElement.lang) ?? defaultLocale;
}

function useDocumentLocale() {
  const [locale, setLocale] = useState(readDocumentLocale);

  useEffect(() => {
    const syncLocale = () => setLocale(readDocumentLocale());
    syncLocale();
    const observer = new MutationObserver(syncLocale);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);

  return locale;
}

interface OrganizationBrandStyles extends CSSProperties {
  "--organization-action-fill": string;
  "--organization-on-action": string;
  "--organization-available-fill": string;
  "--organization-on-available": string;
  "--organization-highlight": string;
  "--organization-dark-action-ink": string;
  "--organization-dark-available-ink": string;
  "--organization-light-action-ink": string;
  "--organization-light-available-ink": string;
}

function validatedBranding(branding: OrganizationBranding | null): OrganizationBranding | null {
  if (
    branding?.enabled !== true
    || typeof branding.companyName !== "string"
    || typeof branding.logoUrl !== "string"
    || !branding.colors
    || typeof branding.colors !== "object"
    || !branding.colors.dark
    || typeof branding.colors.dark !== "object"
    || !branding.colors.light
    || typeof branding.colors.light !== "object"
  ) return null;
  if (
    branding.companyName.trim().length < 1
    || branding.companyName.trim().length > 120
    || !sameOriginLogoPattern.test(branding.logoUrl)
  ) return null;

  const colors = [
    branding.colors.actionFill,
    branding.colors.onAction,
    branding.colors.availableFill,
    branding.colors.onAvailable,
    branding.colors.highlight,
    branding.colors.dark.actionInk,
    branding.colors.dark.availableInk,
    branding.colors.light.actionInk,
    branding.colors.light.availableInk,
  ];
  return colors.every((color) => hexColorPattern.test(color)) ? branding : null;
}

export function OrganizationBrandingProvider({
  branding: rawBranding,
  children,
}: {
  branding: OrganizationBranding | null;
  children: ReactNode;
}) {
  const branding = validatedBranding(rawBranding);
  if (!branding) {
    return <BrandingContext.Provider value={null}>{children}</BrandingContext.Provider>;
  }

  const style: OrganizationBrandStyles = {
    "--organization-action-fill": branding.colors.actionFill,
    "--organization-on-action": branding.colors.onAction,
    "--organization-available-fill": branding.colors.availableFill,
    "--organization-on-available": branding.colors.onAvailable,
    "--organization-highlight": branding.colors.highlight,
    "--organization-dark-action-ink": branding.colors.dark.actionInk,
    "--organization-dark-available-ink": branding.colors.dark.availableInk,
    "--organization-light-action-ink": branding.colors.light.actionInk,
    "--organization-light-available-ink": branding.colors.light.availableInk,
  };

  return (
    <BrandingContext.Provider value={branding}>
      <div className="organization-brand-scope" data-organization-branding="active" style={style}>
        {children}
      </div>
    </BrandingContext.Provider>
  );
}

export function useOrganizationBranding() {
  return useContext(BrandingContext);
}

export function ApplicationBrand({ compact = false }: { compact?: boolean }) {
  const branding = useOrganizationBranding();
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const locale = useDocumentLocale();

  if (!branding || failedLogoUrl === branding.logoUrl) return <Logo compact={compact} />;

  return (
    <span
      className={`organization-brand-lockup ${compact ? "organization-brand-lockup-compact" : ""}`.trim()}
      role="img"
      aria-label={brandingMessages[locale].applicationBrandLabel(branding.companyName)}
    >
      <span className="organization-logo-plate">
        <img
          alt=""
          className="organization-logo"
          decoding="async"
          draggable={false}
          fetchPriority="high"
          height="59"
          onError={() => setFailedLogoUrl(branding.logoUrl)}
          src={branding.logoUrl}
          width="150"
        />
      </span>
      <span className="organization-parkventory-badge" aria-hidden="true">
        <LogoMark />
      </span>
    </span>
  );
}
