#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"

cleanup() {
  exit_code=$?
  trap - EXIT INT TERM
  docker compose --project-directory "${PROJECT_ROOT}" down >/dev/null 2>&1 || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

command -v docker >/dev/null 2>&1 || {
  echo "Docker ou OrbStack est requis pour Parkventory." >&2
  exit 1
}

docker info >/dev/null 2>&1 || {
  echo "Le moteur Docker n'est pas démarré." >&2
  exit 1
}

echo "Démarrage de PostgreSQL, Quarkus et Vite avec Docker Compose"
docker compose --project-directory "${PROJECT_ROOT}" up --build -d --wait

echo "Parkventory est prêt :"
echo "  landing : http://127.0.0.1:${PARKVENTORY_WEB_PORT:-5173}/"
echo "  application : http://127.0.0.1:${PARKVENTORY_WEB_PORT:-5173}/app"
echo "  API : http://127.0.0.1:${PARKVENTORY_API_PORT:-8080}/api/v1/dashboard"
echo "  Swagger UI : http://127.0.0.1:${PARKVENTORY_API_PORT:-8080}/q/swagger-ui"
echo "Arrêtez avec Ctrl-C ; les volumes de développement seront conservés."

docker compose --project-directory "${PROJECT_ROOT}" logs --follow backend frontend
