import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(projectRoot, "assets/brand/parkventory-logo-transparent.svg");
const checkOnly = process.argv.includes("--check");
const sourceBytes = await readFile(source);
const requireFromDocs = createRequire(resolve(projectRoot, "docs-nimbus/package.json"));
let sharp;

try {
  sharp = requireFromDocs("sharp");
} catch {
  console.error("Sharp est requis pour produire le dérivé Open Graph du logo.");
  console.error("Exécuter : npm ci --prefix docs-nimbus");
  process.exit(1);
}

const openGraphBytes = await sharp(sourceBytes)
  .resize({ width: 256 })
  .png({ compressionLevel: 9 })
  .toBuffer();
const targets = [
  {
    path: resolve(projectRoot, "frontend/public/parkventory-logo-transparent.svg"),
    bytes: sourceBytes,
  },
  {
    path: resolve(projectRoot, "frontend/public/favicon.svg"),
    bytes: sourceBytes,
  },
  {
    path: resolve(projectRoot, "docs-nimbus/public/favicon.svg"),
    bytes: sourceBytes,
  },
  {
    path: resolve(projectRoot, "docs-nimbus/public/parkventory-logo-transparent.png"),
    bytes: openGraphBytes,
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
  console.log(`Logo synchronisé : ${target.path.slice(projectRoot.length + 1)}`);
}

if (drifted.length > 0) {
  console.error("Les dérivés publics du logo divergent de la source canonique :");
  for (const target of drifted) console.error(`- ${target}`);
  console.error("Exécuter : npm run brand:sync");
  process.exit(1);
}

if (checkOnly) console.log("Logo vérifié : tous les dérivés publics correspondent au master.");
