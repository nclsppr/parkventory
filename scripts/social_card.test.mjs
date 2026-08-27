import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { buildRasterSvg, renderSocialCard } from "./social_card.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inputs = {
  sourceText: await readFile(
    resolve(projectRoot, "assets/brand/parkventory-social-card.svg"),
    "utf8",
  ),
  logoBytes: await readFile(
    resolve(projectRoot, "assets/brand/parkventory-logo-transparent.svg"),
  ),
  fontBytes: await readFile(
    resolve(projectRoot, "docs-nimbus/public/fonts/Inter-Bold.ttf"),
  ),
};

test("vectorise les trois textes avant le raster", () => {
  const rasterSvg = buildRasterSvg(inputs);

  assert.doesNotMatch(rasterSvg, /<text(?:\s|>)/u);
  assert.doesNotMatch(rasterSvg, /__PARKVENTORY_(?:LOGO|FONT)_BASE64__/u);
  assert.match(rasterSvg, /id="brand-wordmark-outline"/u);
  assert.match(rasterSvg, /id="tagline-line-one-outline"/u);
  assert.match(rasterSvg, /id="tagline-line-two-outline"/u);
});

test("reproduit exactement le PNG public en 1200 par 630", async () => {
  const expected = await readFile(
    resolve(projectRoot, "frontend/public/parkventory-social-card.png"),
  );
  const actual = await renderSocialCard(inputs);
  const metadata = await sharp(actual).metadata();
  const expectedHash = createHash("sha256").update(expected).digest("hex");
  const actualHash = createHash("sha256").update(actual).digest("hex");

  assert.equal(actualHash, expectedHash);
  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
});
