import {
  localeConfig,
  localizedManifestPath,
  seoMetadata,
  socialImageUrl,
  type Locale,
  type RouteId,
} from "../../shared/i18n";
import { escapeHtml } from "./security";
import { localizedVisibleContent } from "./public-content";

function meta(attribute: "name" | "property", key: string, content: string) {
  return `<meta data-seo-managed="true" ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}">`;
}

function link(rel: string, href: string, hrefLang?: string) {
  const language = hrefLang ? ` hreflang="${escapeHtml(hrefLang)}"` : "";
  return `<link data-seo-managed="true" rel="${escapeHtml(rel)}" href="${escapeHtml(href)}"${language}>`;
}

export function localizedHead(
  locale: Locale,
  route: RouteId,
  options: { forceNoIndex?: boolean } = {},
): string {
  const seo = seoMetadata(locale, route);
  const indexable = seo.indexable && !options.forceNoIndex;
  const elements = [
    `<title data-seo-managed="true">${escapeHtml(seo.title)}</title>`,
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

  if (route === "home" && seo.canonicalUrl) {
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Parkventory",
      url: seo.canonicalUrl,
      image: socialImage,
      description: seo.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: seo.inLanguage,
    }).replaceAll("<", "\\u003c");
    elements.push(
      `<script data-seo-managed="true" type="application/ld+json">${structuredData}</script>`,
    );
  }

  return elements.join("");
}

export function localizedHtmlResponse(
  response: Response,
  locale: Locale,
  route: RouteId,
  options: { forceNoIndex?: boolean; status?: number } = {},
): Response {
  const seo = seoMetadata(locale, route);
  const visibleContent = localizedVisibleContent(locale, route);
  const headers = new Headers(response.headers);
  headers.delete("ETag");
  headers.delete("Last-Modified");
  headers.set("Content-Language", localeConfig[locale].htmlLang);
  if (!seo.indexable || options.forceNoIndex) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    headers.delete("X-Robots-Tag");
  }

  const source = new Response(response.body, {
    status: options.status ?? response.status,
    statusText: options.status ? undefined : response.statusText,
    headers,
  });

  return new HTMLRewriter()
    .on("html", {
      element(element) {
        element.setAttribute("lang", localeConfig[locale].htmlLang);
      },
    })
    .on('[data-seo-managed="true"]', {
      element(element) {
        element.remove();
      },
    })
    .on("head", {
      element(element) {
        element.append(localizedHead(locale, route, options), { html: true });
      },
    })
    .on("#root", {
      element(element) {
        if (visibleContent) element.setInnerContent(visibleContent, { html: true });
      },
    })
    .transform(source);
}
