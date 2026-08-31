import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { renderSocialCard } from "./social_card.mjs";
import {
  localeConfig,
  localizedPath,
  seoMetadata,
  supportedLocales,
} from "../shared/i18n.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const logoSource = resolve(projectRoot, "assets/brand/parkventory-logo-transparent.svg");
const socialCardSource = resolve(projectRoot, "assets/brand/parkventory-social-card.svg");
const interSource = resolve(
  projectRoot,
  "docs-nimbus/public/fonts/Inter-Bold.ttf",
);
const checkOnly = process.argv.includes("--check");
const logoBytes = await readFile(logoSource);
const interBytes = await readFile(interSource);
const socialCardText = await readFile(socialCardSource, "utf8");

function squareFavicon(sourceBytes) {
  const source = sourceBytes.toString("utf8");
  const dimensions = 'width="554" height="560" viewBox="0 0 554 560"';
  if (!source.includes(dimensions)) {
    throw new Error("Le master du symbole ne porte plus les dimensions attendues.");
  }
  return Buffer.from(source.replace(
    dimensions,
    'width="560" height="560" viewBox="-3 0 560 560"',
  ));
}

const faviconBytes = squareFavicon(logoBytes);

const canonicalLogoAnchor = 'href="__PARKVENTORY_LOGO_BASE64__"';
const embeddedFontAnchor = 'src: url("__PARKVENTORY_FONT_BASE64__") format("truetype");';

if (
  !socialCardText.includes(canonicalLogoAnchor)
  || !socialCardText.includes(embeddedFontAnchor)
) {
  console.error("La source de la carte sociale ne contient plus ses ancres de synchronisation.");
  process.exit(1);
}

const openGraphBytes = await sharp(logoBytes)
  .resize({ width: 256 })
  .png({ compressionLevel: 9 })
  .toBuffer();
const socialCardCopy = {
  fr: {
    title: "Parkventory, le parking partagé, simplement",
    lineOne: "Le parking partagé,",
    lineTwo: "simplement.",
  },
  en: {
    title: "Parkventory, shared parking made simple",
    lineOne: "Shared parking,",
    lineTwo: "made simple.",
  },
  de: {
    title: "Parkventory, Parkplätze teilen, ganz einfach",
    lineOne: "Parkplätze teilen,",
    lineTwo: "ganz einfach.",
  },
  lb: {
    title: "Parkventory, Parkplazen deelen, ganz einfach",
    lineOne: "Parkplazen deelen,",
    lineTwo: "ganz einfach.",
  },
};
const socialCards = new Map();
for (const locale of supportedLocales) {
  socialCards.set(locale, await renderSocialCard({
    sourceText: socialCardText,
    logoBytes,
    fontBytes: interBytes,
    copy: {
      ...socialCardCopy[locale],
      description: seoMetadata(locale, "home").socialImageAlt,
    },
  }));
}

async function squareIcon(size, logoScale) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(logoBytes)
    .resize(logoSize, logoSize, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#030504",
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ adaptiveFiltering: true, compressionLevel: 9 })
    .toBuffer();
}

const icon192 = await squareIcon(192, 0.66);
const icon512 = await squareIcon(512, 0.66);
const maskableIcon512 = await squareIcon(512, 0.52);
const appleTouchIcon = await squareIcon(180, 0.66);

function manifest(locale) {
  return Buffer.from(`${JSON.stringify({
    id: localizedPath(locale, "home"),
    name: "Parkventory",
    short_name: "Parkventory",
    description: seoMetadata(locale, "home").description,
    lang: localeConfig[locale].htmlLang,
    start_url: localizedPath(locale, "home"),
    scope: "/",
    display: "standalone",
    background_color: "#030504",
    theme_color: "#030504",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }, null, 2)}\n`);
}
const targets = [
  {
    path: resolve(projectRoot, "frontend/public/parkventory-logo-transparent.svg"),
    bytes: logoBytes,
  },
  {
    path: resolve(projectRoot, "frontend/public/favicon.svg"),
    bytes: faviconBytes,
  },
  {
    path: resolve(projectRoot, "docs-nimbus/public/favicon.svg"),
    bytes: logoBytes,
  },
  {
    path: resolve(projectRoot, "docs-nimbus/public/parkventory-logo-transparent.png"),
    bytes: openGraphBytes,
  },
  {
    path: resolve(projectRoot, "frontend/public/parkventory-social-card.png"),
    bytes: socialCards.get("fr"),
  },
  ...supportedLocales.map((locale) => ({
    path: resolve(projectRoot, `frontend/public/parkventory-social-card-${locale}.png`),
    bytes: socialCards.get(locale),
  })),
  { path: resolve(projectRoot, "frontend/public/icon-192.png"), bytes: icon192 },
  { path: resolve(projectRoot, "frontend/public/icon-512.png"), bytes: icon512 },
  { path: resolve(projectRoot, "frontend/public/icon-maskable-512.png"), bytes: maskableIcon512 },
  { path: resolve(projectRoot, "frontend/public/apple-touch-icon.png"), bytes: appleTouchIcon },
  ...supportedLocales.map((locale) => ({
    path: resolve(projectRoot, `frontend/public/manifest-${locale}.webmanifest`),
    bytes: manifest(locale),
  })),
];
const drifted = [];

for (const target of targets) {
  let targetBytes = null;
  try {
    targetBytes = await readFile(target.path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (targetBytes?.equals(target.bytes)) continue;
  if (checkOnly) {
    drifted.push(target.path.slice(projectRoot.length + 1));
    continue;
  }

  await mkdir(dirname(target.path), { recursive: true });
  await writeFile(target.path, target.bytes);
  console.log(`Asset de marque synchronisé : ${target.path.slice(projectRoot.length + 1)}`);
}

if (drifted.length > 0) {
  console.error("Les sources ou dérivés de marque divergent de leurs entrées canoniques :");
  for (const target of drifted) console.error(`- ${target}`);
  console.error("Exécuter : npm run brand:sync");
  process.exit(1);
}

if (checkOnly) {
  console.log("Marque vérifiée : logo et carte sociale correspondent aux sources canoniques.");
}
