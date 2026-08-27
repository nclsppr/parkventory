import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { renderSocialCard } from "./social_card.mjs";

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
const socialCardBytes = await renderSocialCard({
  sourceText: socialCardText,
  logoBytes,
  fontBytes: interBytes,
});
const targets = [
  {
    path: resolve(projectRoot, "frontend/public/parkventory-logo-transparent.svg"),
    bytes: logoBytes,
  },
  {
    path: resolve(projectRoot, "frontend/public/favicon.svg"),
    bytes: logoBytes,
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
    bytes: socialCardBytes,
  },
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
