#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
DIST_DIR="${PROJECT_ROOT}/frontend/dist"

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

echo "Démo Pages construite avec les routes /app, /app/partager, /app/trouver et /auth/callback."
