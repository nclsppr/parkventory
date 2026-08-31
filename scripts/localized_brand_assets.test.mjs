import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(projectRoot, "frontend/public");
const locales = ["fr", "en", "de", "lb"];

const manifestDescriptions = {
  fr: "Partagez et réservez les places de parking disponibles entre collègues, simplement et sans double attribution.",
  en: "Share and book available workplace parking spaces with colleagues, simply and without double bookings.",
  de: "Teilen und buchen Sie verfügbare Firmenparkplätze mit Kolleginnen und Kollegen – einfach und ohne Doppelbuchungen.",
  lb: "Deelt a reservéiert fräi Parkplaze mat Äre Kolleegen – einfach an ouni duebel Reservatioun.",
};

const expectedIcons = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const rasterIcons = [
  { filename: "icon-192.png", width: 192, height: 192 },
  { filename: "icon-512.png", width: 512, height: 512 },
  { filename: "icon-maskable-512.png", width: 512, height: 512 },
  { filename: "apple-touch-icon.png", width: 180, height: 180 },
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("publie quatre cartes sociales 1200 par 630 distinctes et conserve l’alias français", async () => {
  const hashes = [];
  let frenchCard;

  for (const locale of locales) {
    const bytes = await readFile(
      resolve(publicRoot, `parkventory-social-card-${locale}.png`),
    );
    const metadata = await sharp(bytes).metadata();

    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    hashes.push(sha256(bytes));
    if (locale === "fr") frenchCard = bytes;
  }

  assert.equal(new Set(hashes).size, locales.length);

  const historicalAlias = await readFile(
    resolve(publicRoot, "parkventory-social-card.png"),
  );
  assert.ok(frenchCard);
  assert.ok(historicalAlias.equals(frenchCard));
});

test("conserve les dimensions exactes et une surface entièrement opaque pour chaque icône", async () => {
  for (const icon of rasterIcons) {
    const bytes = await readFile(resolve(publicRoot, icon.filename));
    const image = sharp(bytes);
    const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);

    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, icon.width);
    assert.equal(metadata.height, icon.height);
    assert.equal(stats.isOpaque, true);
    assert.equal(stats.channels.at(-1)?.min, 255);
    assert.equal(stats.channels.at(-1)?.max, 255);
  }

  const regular512 = await readFile(resolve(publicRoot, "icon-512.png"));
  const maskable512 = await readFile(resolve(publicRoot, "icon-maskable-512.png"));
  assert.notEqual(sha256(maskable512), sha256(regular512));
});

test("publie un favicon SVG strictement carré sans modifier la géométrie du symbole", async () => {
  const favicon = await readFile(resolve(publicRoot, "favicon.svg"), "utf8");
  const master = await readFile(
    resolve(projectRoot, "assets/brand/parkventory-logo-transparent.svg"),
    "utf8",
  );
  const metadata = await sharp(Buffer.from(favicon)).metadata();

  assert.equal(metadata.format, "svg");
  assert.equal(metadata.width, 560);
  assert.equal(metadata.height, 560);
  assert.match(favicon, /viewBox="-3 0 560 560"/u);

  const normalizeCanvas = (svg) => svg.replace(
    /width="(?:554|560)" height="560" viewBox="(?:0 0 554 560|-3 0 560 560)"/u,
    "CANVAS",
  );
  assert.equal(normalizeCanvas(favicon), normalizeCanvas(master));
});

test("publie quatre manifestes localisés valides avec les icônes attendues", async () => {
  const descriptions = new Set();

  for (const locale of locales) {
    const manifestText = await readFile(
      resolve(publicRoot, `manifest-${locale}.webmanifest`),
      "utf8",
    );
    const manifest = JSON.parse(manifestText);

    assert.equal(manifest.id, `/${locale}/`);
    assert.equal(manifest.name, "Parkventory");
    assert.equal(manifest.short_name, "Parkventory");
    assert.equal(manifest.lang, locale);
    assert.equal(manifest.start_url, `/${locale}/`);
    assert.equal(manifest.scope, "/");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.description, manifestDescriptions[locale]);
    assert.equal(manifest.background_color, "#030504");
    assert.equal(manifest.theme_color, "#030504");
    assert.deepEqual(manifest.icons, expectedIcons);
    descriptions.add(manifest.description);

    for (const icon of manifest.icons) {
      const size = icon.sizes.match(/^(\d+)x(\d+)$/u);
      assert.ok(size);

      const metadata = await sharp(
        await readFile(resolve(publicRoot, icon.src.replace(/^\//u, ""))),
      ).metadata();
      assert.equal(metadata.format, "png");
      assert.equal(metadata.width, Number(size[1]));
      assert.equal(metadata.height, Number(size[2]));
    }
  }

  assert.equal(descriptions.size, locales.length);
});
