#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
DIST_DIR="${PROJECT_ROOT}/frontend/dist"
NIMBUS_DIST_DIR="${PROJECT_ROOT}/docs-nimbus/dist"
NIMBUS_CACHE_DIR="${PROJECT_ROOT}/docs-nimbus/.astro"
PUBLIC_DOCS_DIR="${DIST_DIR}/docs"

VITE_BASE_PATH=/parkventory/ \
VITE_DEMO_MODE=true \
  npm run frontend:build --prefix "${PROJECT_ROOT}"

mkdir -p \
  "${DIST_DIR}/app/partager" \
  "${DIST_DIR}/app/trouver" \
  "${DIST_DIR}/auth/callback"

for route in \
  app/index.html \
  app/partager/index.html \
  app/trouver/index.html \
  auth/callback/index.html \
  404.html
do
  cp "${DIST_DIR}/index.html" "${DIST_DIR}/${route}"
  cmp -s "${DIST_DIR}/index.html" "${DIST_DIR}/${route}" || {
    echo "La route Pages ${route} ne contient pas le shell courant." >&2
    exit 1
  }
done

touch "${DIST_DIR}/.nojekyll"

grep -q '/parkventory/assets/' "${DIST_DIR}/index.html" || {
  echo "Le build Pages ne porte pas le chemin de base /parkventory/." >&2
  exit 1
}

# Astro conserve un cache de collection entre deux portées Nimbus. Le build
# Pages doit repartir d'un état vide après un éventuel check local complet,
# sinon des routes internes peuvent survivre dans l'artefact public.
for generated_dir in "${NIMBUS_DIST_DIR}" "${NIMBUS_CACHE_DIR}"
do
  case "${generated_dir}" in
    "${PROJECT_ROOT}/docs-nimbus/dist"|"${PROJECT_ROOT}/docs-nimbus/.astro") ;;
    *)
      echo "Refus de nettoyer un chemin Nimbus inattendu : ${generated_dir}" >&2
      exit 1
      ;;
  esac
  rm -rf -- "${generated_dir}"
done

ASTRO_TELEMETRY_DISABLED=1 \
NIMBUS_PUBLIC_COLLECTIONS=product \
NIMBUS_SITE_ORIGIN=https://nclsppr.github.io \
NIMBUS_BASE_PATH=/parkventory/docs \
NIMBUS_TITLE='Documentation Parkventory' \
NIMBUS_DESCRIPTION='Vision, parcours, rôles et règles produit de Parkventory.' \
NIMBUS_GITHUB=https://github.com/nclsppr/parkventory \
  npm run check --prefix "${PROJECT_ROOT}/docs-nimbus"

if grep -R -E '^visibility: (internal|reference|archive)$' \
  "${PROJECT_ROOT}/docs-nimbus/src/content/docs" >/dev/null 2>&1; then
  echo "Le build Nimbus public contient une audience non publique." >&2
  exit 1
fi

for forbidden_path in \
  project \
  status \
  design \
  delivery-evidence \
  docs/decisions \
  docs/internal \
  docs/foundation \
  docs-nimbus
do
  if [[ -e "${NIMBUS_DIST_DIR}/${forbidden_path}" ]]; then
    echo "Le build Nimbus public expose le chemin interdit ${forbidden_path}." >&2
    exit 1
  fi
done

mkdir -p "${PUBLIC_DOCS_DIR}"
cp -R "${NIMBUS_DIST_DIR}/." "${PUBLIC_DOCS_DIR}/"
if [[ -d "${PUBLIC_DOCS_DIR}/.prerender" ]]; then
  rm -rf "${PUBLIC_DOCS_DIR}/.prerender"
fi

grep -q 'https://nclsppr.github.io/parkventory/docs/llms-full.txt' \
  "${PUBLIC_DOCS_DIR}/llms.txt" || {
  echo "L'index agent Nimbus ne porte pas le chemin Pages public." >&2
  exit 1
}

grep -q 'href="/parkventory/docs/docs/product/vision/"' \
  "${PUBLIC_DOCS_DIR}/index.html" || {
  echo "L'accueil Nimbus ne pointe pas vers la collection produit publique." >&2
  exit 1
}

grep -q '<title>Documentation Parkventory</title>' \
  "${PUBLIC_DOCS_DIR}/index.html" || {
  echo "L'accueil Nimbus ne porte pas le titre public attendu." >&2
  exit 1
}

grep -q 'href="https://nclsppr.github.io/parkventory/docs/"' \
  "${PUBLIC_DOCS_DIR}/index.html" || {
  echo "L'URL canonique Nimbus n'utilise pas le chemin Pages public." >&2
  exit 1
}

grep -q 'content="https://nclsppr.github.io/parkventory/docs/og.png"' \
  "${PUBLIC_DOCS_DIR}/index.html" || {
  echo "L'image Open Graph Nimbus n'utilise pas le chemin Pages public." >&2
  exit 1
}

grep -q '<loc>https://nclsppr.github.io/parkventory/docs/</loc>' \
  "${PUBLIC_DOCS_DIR}/sitemap-0.xml" || {
  echo "Le sitemap Nimbus n'utilise pas le chemin Pages public." >&2
  exit 1
}

grep -q '^Allow: /parkventory/docs/$' "${PUBLIC_DOCS_DIR}/robots.txt" || {
  echo "Le robots.txt Nimbus n'utilise pas le chemin Pages public." >&2
  exit 1
}

[[ -f "${PUBLIC_DOCS_DIR}/pagefind/pagefind.js" ]] || {
  echo "L'index de recherche Pagefind Nimbus est absent." >&2
  exit 1
}

echo "Artefact Pages construit : démo frontend et documentation Nimbus publique sous /docs/."
