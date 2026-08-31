import indexHtml from "../index.html?raw";
import { afterEach, describe, expect, it } from "vitest";
import { seoMetadata, supportedLocales } from "../../shared/i18n";
import { applyClientMetadata } from "./i18n/metadata";

const document = new DOMParser().parseFromString(indexHtml, "text/html");
const frenchHomeUrl = "https://parkventory.com/fr/";
const frenchSocialImage = "https://parkventory.com/parkventory-social-card-fr.png";
const frenchDescription =
  "Partagez et réservez les places de parking disponibles entre collègues, simplement et sans double attribution.";
const frenchSocialImageAlt =
  "Carte sociale Parkventory avec le symbole canonique et un parcours entre une place partagée et une place sélectionnée.";
const runtimeHead = globalThis.document.head.innerHTML;
const runtimeTitle = globalThis.document.title;

afterEach(() => {
  globalThis.document.head.innerHTML = runtimeHead;
  globalThis.document.title = runtimeTitle;
});

function metaContent(selector: string) {
  return document.querySelector<HTMLMetaElement>(selector)?.content;
}

describe("métadonnées de repli", () => {
  it("livre un document français non indexable avec la canonique française", () => {
    expect(document.documentElement.lang).toBe("fr");
    expect(document.title).toBe("Parkventory — Le parking partagé, simplement");
    expect(metaContent('meta[name="description"]')).toBe(frenchDescription);
    expect(metaContent('meta[name="robots"]')).toBe("noindex, nofollow");
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href)
      .toBe(frenchHomeUrl);
  });

  it("référence la carte sociale et le manifeste français", () => {
    expect(metaContent('meta[property="og:type"]')).toBe("website");
    expect(metaContent('meta[property="og:locale"]')).toBe("fr_LU");
    expect(metaContent('meta[property="og:url"]')).toBe(frenchHomeUrl);
    expect(metaContent('meta[property="og:image"]')).toBe(frenchSocialImage);
    expect(metaContent('meta[property="og:image:type"]')).toBe("image/png");
    expect(metaContent('meta[property="og:image:width"]')).toBe("1200");
    expect(metaContent('meta[property="og:image:height"]')).toBe("630");
    expect(metaContent('meta[property="og:image:alt"]')).toBe(frenchSocialImageAlt);
    expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(metaContent('meta[name="twitter:image"]')).toBe(frenchSocialImage);
    expect(metaContent('meta[name="twitter:image:alt"]')).toBe(frenchSocialImageAlt);
    expect(document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.getAttribute("href"))
      .toBe("%BASE_URL%manifest-fr.webmanifest");
  });

  it("publie un JSON-LD français cohérent avec la canonique", () => {
    const script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    const structuredData = JSON.parse(script?.textContent ?? "null");

    expect(structuredData).toEqual({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Parkventory",
      url: frenchHomeUrl,
      image: frenchSocialImage,
      description: frenchDescription,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr-LU",
    });
  });
});

describe("métadonnées client localisées", () => {
  it.each(supportedLocales)("utilise une description sociale dédiée en %s", (locale) => {
    globalThis.document.head.innerHTML = "";
    applyClientMetadata(locale, "home");
    const metadata = seoMetadata(locale, "home");

    expect(
      globalThis.document.querySelector<HTMLMetaElement>('meta[property="og:image:alt"]')?.content,
    ).toBe(metadata.socialImageAlt);
    expect(
      globalThis.document.querySelector<HTMLMetaElement>('meta[name="twitter:image:alt"]')?.content,
    ).toBe(metadata.socialImageAlt);
    expect(metadata.socialImageAlt).not.toBe(metadata.title);
  });
});
