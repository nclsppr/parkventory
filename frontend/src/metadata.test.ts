import indexHtml from "../index.html?raw";
import { describe, expect, it } from "vitest";

const document = new DOMParser().parseFromString(indexHtml, "text/html");

function metaContent(selector: string) {
  return document.querySelector<HTMLMetaElement>(selector)?.content;
}

describe("métadonnées publiques", () => {
  it("déclare l'accueil comme URL canonique indexable", () => {
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href)
      .toBe("https://parkventory.com/");
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("publie une carte Open Graph et Twitter stable", () => {
    const imageUrl = "https://parkventory.com/parkventory-social-card.png";

    expect(metaContent('meta[property="og:type"]')).toBe("website");
    expect(metaContent('meta[property="og:locale"]')).toBe("fr_FR");
    expect(metaContent('meta[property="og:url"]')).toBe("https://parkventory.com/");
    expect(metaContent('meta[property="og:image"]')).toBe(imageUrl);
    expect(metaContent('meta[property="og:image:type"]')).toBe("image/png");
    expect(metaContent('meta[property="og:image:width"]')).toBe("1200");
    expect(metaContent('meta[property="og:image:height"]')).toBe("630");
    expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(metaContent('meta[name="twitter:image"]')).toBe(imageUrl);
  });

  it("décrit prudemment l'application sans métrique ni état de validation", () => {
    const script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    const structuredData = JSON.parse(script?.textContent ?? "null");

    expect(structuredData).toEqual({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Parkventory",
      url: "https://parkventory.com/",
      image: "https://parkventory.com/parkventory-social-card.png",
      description:
        "Parkventory permet aux collègues de partager et réserver les places de parking disponibles dans leur entreprise.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr-FR",
    });
  });
});
