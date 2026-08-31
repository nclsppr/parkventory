/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { describe, expect, it } from "vitest";
import { seoMetadata, supportedLocales } from "../../shared/i18n";
import { localizedHead, localizedHtmlResponse } from "../src/seo";

describe("SEO HTML initial", () => {
  it.each(supportedLocales)("produit les métadonnées complètes de l’accueil %s", (locale) => {
    const head = localizedHead(locale, "home");
    const metadata = seoMetadata(locale, "home");

    expect(head).toContain('name="robots" content="index, follow"');
    expect(head).toContain(`rel="canonical" href="https://parkventory.com/${locale}/"`);
    expect(head).toContain(`rel="manifest" href="/manifest-${locale}.webmanifest"`);
    expect(head).toContain(`property="og:image" content="https://parkventory.com/parkventory-social-card-${locale}.png"`);
    expect(head).toContain(`property="og:image:alt" content="${metadata.socialImageAlt}"`);
    expect(head).toContain(`name="twitter:image:alt" content="${metadata.socialImageAlt}"`);
    expect(metadata.socialImageAlt).not.toBe(metadata.title);
    expect(head).toContain('type="application/ld+json"');
    expect(head.match(/rel="alternate"/g)).toHaveLength(5);
    expect(head).toContain('href="https://parkventory.com/" hreflang="x-default"');
  });

  it("garde les routes privées hors index sans hreflang", () => {
    const head = localizedHead("de", "app");

    expect(head).toContain('name="robots" content="noindex, nofollow"');
    expect(head).toContain('rel="canonical" href="https://parkventory.com/de/app"');
    expect(head).not.toContain('rel="alternate"');
    expect(head).not.toContain('application/ld+json');
  });

  it.each(supportedLocales)("injecte du contenu visible sans JavaScript sur les trois pages publiques %s", async (locale) => {
    for (const route of ["home", "privacy", "legal"] as const) {
      const shell = new Response(
        "<!doctype html><html><head></head><body><div id=\"root\"></div><script src=\"/app.js\"></script></body></html>",
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
      const response = localizedHtmlResponse(shell, locale, route);
      const html = await response.text();

      expect(html).toContain(`data-server-rendered="${route}"`);
      expect(html).toContain("<h1>");
      expect(html).toContain(`href="/${locale}/`);
      expect(html).not.toContain('<div id="root"></div>');
    }
  });

  it("renvoie une vraie 404 localisée et remplace les métadonnées du shell", async () => {
    const shell = new Response(`<!doctype html><html lang="fr"><head>
      <title data-seo-managed="true">Ancien titre</title>
      <meta data-seo-managed="true" name="robots" content="index, follow">
    </head><body><div id="root"></div></body></html>`, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

    const response = localizedHtmlResponse(shell, "lb", "notFound", { status: 404 });
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Language")).toBe("lb");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(html).toContain('<html lang="lb">');
    expect(html).toContain("Säit net fonnt — Parkventory");
    expect(html).toContain('data-server-rendered="notFound"');
    expect(html).toContain("Dës Parkplaz gëtt et net.");
    expect(html).not.toContain("Ancien titre");
    expect(html.match(/name="robots"/g)).toHaveLength(1);
    expect(html).not.toContain('rel="canonical"');
  });

  it("force le noindex HTTP sur un aperçu sans dégrader les métadonnées publiques", async () => {
    const shell = new Response("<!doctype html><html><head></head><body></body></html>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
    const response = localizedHtmlResponse(shell, "en", "privacy", { forceNoIndex: true });
    const html = await response.text();

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain('rel="canonical" href="https://parkventory.com/en/privacy"');
  });

  it("retire les validateurs du shell devenus obsolètes après transformation", () => {
    const shell = new Response("<!doctype html><html><head></head><body></body></html>", {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ETag: '"shell-v1"',
        "Last-Modified": "Sun, 30 Aug 2026 12:00:00 GMT",
      },
    });

    const response = localizedHtmlResponse(shell, "fr", "home");

    expect(response.headers.get("ETag")).toBeNull();
    expect(response.headers.get("Last-Modified")).toBeNull();
  });
});
