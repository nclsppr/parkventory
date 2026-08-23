#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

if [[ $# -ne 1 || ( $1 != pages && $1 != atlas ) ]]; then
  echo "usage: build_public_demo.sh <pages|atlas>" >&2
  exit 64
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
DIST_DIR="${PROJECT_ROOT}/frontend/dist"
target=$1

if [[ $target == pages ]]; then
  base_path=/parkventory/
else
  base_path=/
fi

VITE_BASE_PATH="${base_path}" \
VITE_DEMO_MODE=true \
  npm run frontend:build --prefix "${PROJECT_ROOT}"

mkdir -p \
  "${DIST_DIR}/app/partager" \
  "${DIST_DIR}/app/trouver" \
  "${DIST_DIR}/auth/callback" \
  "${DIST_DIR}/confidentialite" \
  "${DIST_DIR}/mentions-legales"

for route in \
  app/index.html \
  app/partager/index.html \
  app/trouver/index.html \
  auth/callback/index.html \
  confidentialite/index.html \
  mentions-legales/index.html \
  404.html
do
  cp "${DIST_DIR}/index.html" "${DIST_DIR}/${route}"
  cmp -s "${DIST_DIR}/index.html" "${DIST_DIR}/${route}" || {
    echo "La route ${target} ${route} ne contient pas le shell courant." >&2
    exit 1
  }
done

if [[ $target == pages ]]; then
  touch "${DIST_DIR}/.nojekyll"
  grep -q '/parkventory/assets/' "${DIST_DIR}/index.html" || {
    echo "Le build Pages ne porte pas le chemin de base /parkventory/." >&2
    exit 1
  }
else
  if grep -Eq '(src|href)="/parkventory/' "${DIST_DIR}/index.html"; then
    echo "Le build Atlas contient encore un chemin GitHub Pages." >&2
    exit 1
  fi
  grep -Eq '(src|href)="/assets/' "${DIST_DIR}/index.html" || {
    echo "Le build Atlas ne porte pas le chemin de base racine." >&2
    exit 1
  }
fi

echo "Démo ${target} construite avec les routes applicatives et légales directes."
