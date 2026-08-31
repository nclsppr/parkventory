import { describe, expect, it } from "vitest";
import robots from "../public/robots.txt?raw";
import sitemap from "../public/sitemap.xml?raw";

const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const xhtmlNamespace = "http://www.w3.org/1999/xhtml";
const locales = ["fr", "en", "de", "lb"] as const;

const publicRouteGroups = [
  {
    localized: {
      fr: "https://parkventory.com/fr/",
      en: "https://parkventory.com/en/",
      de: "https://parkventory.com/de/",
      lb: "https://parkventory.com/lb/",
    },
    xDefault: "https://parkventory.com/",
  },
  {
    localized: {
      fr: "https://parkventory.com/fr/confidentialite",
      en: "https://parkventory.com/en/privacy",
      de: "https://parkventory.com/de/datenschutz",
      lb: "https://parkventory.com/lb/dateschutz",
    },
    xDefault: "https://parkventory.com/privacy",
  },
  {
    localized: {
      fr: "https://parkventory.com/fr/mentions-legales",
      en: "https://parkventory.com/en/legal-notice",
      de: "https://parkventory.com/de/impressum",
      lb: "https://parkventory.com/lb/impressum",
    },
    xDefault: "https://parkventory.com/legal",
  },
] as const;

const expectedLocations = publicRouteGroups.flatMap(({ localized }) =>
  locales.map((locale) => localized[locale]),
);

function childText(element: Element, namespace: string, localName: string) {
  return element.getElementsByTagNameNS(namespace, localName)[0]?.textContent ?? "";
}

describe("indexation publique", () => {
  it("publie exactement les douze URL publiques localisées", () => {
    const document = new DOMParser().parseFromString(sitemap, "application/xml");
    const urls = [...document.getElementsByTagNameNS(sitemapNamespace, "url")];
    const locations = urls.map((url) => childText(url, sitemapNamespace, "loc"));

    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.documentElement.localName).toBe("urlset");
    expect(document.documentElement.namespaceURI).toBe(sitemapNamespace);
    expect(urls).toHaveLength(12);
    expect(locations).toEqual(expectedLocations);
    expect(new Set(locations).size).toBe(12);
    expect(locations.some((location) => /\/(?:app|auth)(?:\/|$)/u.test(new URL(location).pathname)))
      .toBe(false);
  });

  it("associe à chaque URL les quatre hreflang et le x-default de sa route", () => {
    const document = new DOMParser().parseFromString(sitemap, "application/xml");
    const urls = [...document.getElementsByTagNameNS(sitemapNamespace, "url")];

    urls.forEach((url) => {
      const location = childText(url, sitemapNamespace, "loc");
      const group = publicRouteGroups.find(({ localized }) =>
        (Object.values(localized) as readonly string[]).includes(location),
      );
      expect(group).toBeDefined();

      const alternates = [...url.getElementsByTagNameNS(xhtmlNamespace, "link")].map((link) => ({
        rel: link.getAttribute("rel"),
        hreflang: link.getAttribute("hreflang"),
        href: link.getAttribute("href"),
      }));
      const expectedAlternates = [
        ...locales.map((locale) => ({
          rel: "alternate",
          hreflang: locale,
          href: group?.localized[locale],
        })),
        {
          rel: "alternate",
          hreflang: "x-default",
          href: group?.xDefault,
        },
      ];

      expect(alternates).toHaveLength(5);
      expect(alternates).toEqual(expectedAlternates);
    });
  });

  it("autorise explicitement l’exploration et annonce le sitemap", () => {
    expect(
      robots
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter(Boolean),
    ).toEqual([
      "User-agent: *",
      "Allow: /",
      "Sitemap: https://parkventory.com/sitemap.xml",
    ]);
  });
});
