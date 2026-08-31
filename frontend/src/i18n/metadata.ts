import {
  localizedManifestPath,
  seoMetadata,
  socialImageUrl,
  type Locale,
  type RouteId,
} from "../../../shared/i18n";

const managedAttribute = "data-seo-managed";

function meta(attribute: "name" | "property", key: string, content: string) {
  const element = document.createElement("meta");
  element.setAttribute(attribute, key);
  element.content = content;
  element.setAttribute(managedAttribute, "true");
  return element;
}

function link(rel: string, href: string, hrefLang?: string) {
  const element = document.createElement("link");
  element.rel = rel;
  element.href = href;
  if (hrefLang) element.hreflang = hrefLang;
  element.setAttribute(managedAttribute, "true");
  return element;
}

export function applyClientMetadata(locale: Locale, route: RouteId) {
  document.head.querySelectorAll(`[${managedAttribute}="true"]`).forEach((element) => element.remove());

  const seo = seoMetadata(locale, route);
  const indexable = seo.indexable && window.location.hostname === "parkventory.com";
  document.title = seo.title;
  const elements: HTMLElement[] = [
    meta("name", "description", seo.description),
    meta("name", "robots", indexable ? "index, follow" : "noindex, nofollow"),
    link("manifest", localizedManifestPath(locale)),
  ];
  const socialImage = socialImageUrl(locale);

  if (seo.canonicalUrl) elements.push(link("canonical", seo.canonicalUrl));

  if (seo.indexable && seo.canonicalUrl) {
    elements.push(
      meta("property", "og:type", "website"),
      meta("property", "og:locale", seo.ogLocale),
      meta("property", "og:site_name", "Parkventory"),
      meta("property", "og:title", seo.title),
      meta("property", "og:description", seo.description),
      meta("property", "og:url", seo.canonicalUrl),
      meta("property", "og:image", socialImage),
      meta("property", "og:image:type", "image/png"),
      meta("property", "og:image:width", "1200"),
      meta("property", "og:image:height", "630"),
      meta("property", "og:image:alt", seo.socialImageAlt),
      meta("name", "twitter:card", "summary_large_image"),
      meta("name", "twitter:title", seo.title),
      meta("name", "twitter:description", seo.description),
      meta("name", "twitter:image", socialImage),
      meta("name", "twitter:image:alt", seo.socialImageAlt),
    );
    seo.ogLocaleAlternates.forEach((alternate) => {
      elements.push(meta("property", "og:locale:alternate", alternate));
    });
    seo.alternates.forEach((alternate) => {
      elements.push(link("alternate", alternate.href, alternate.hrefLang));
    });
  }

  elements.forEach((element) => document.head.append(element));

  if (route === "home" && seo.canonicalUrl) {
    const structuredData = document.createElement("script");
    structuredData.type = "application/ld+json";
    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Parkventory",
      url: seo.canonicalUrl,
      image: socialImage,
      description: seo.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: seo.inLanguage,
    });
    structuredData.setAttribute(managedAttribute, "true");
    document.head.append(structuredData);
  }
}
