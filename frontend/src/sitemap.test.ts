import { describe, expect, it } from "vitest";
import robots from "../public/robots.txt?raw";
import sitemap from "../public/sitemap.xml?raw";

describe("indexation publique", () => {
  it("publie uniquement les pages publiques dans un sitemap XML valide", () => {
    const document = new DOMParser().parseFromString(sitemap, "application/xml");

    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.documentElement.localName).toBe("urlset");
    expect(document.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect([...document.querySelectorAll("loc")].map((location) => location.textContent)).toEqual([
      "https://parkventory.com/",
      "https://parkventory.com/confidentialite",
      "https://parkventory.com/mentions-legales",
    ]);
  });

  it("annonce le sitemap canonique aux robots", () => {
    expect(robots.trim()).toBe("Sitemap: https://parkventory.com/sitemap.xml");
  });
});
