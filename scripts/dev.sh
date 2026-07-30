#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
BACKEND_PID=""

cleanup() {
  exit_code=$?
  trap - EXIT INT TERM
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
    wait "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi
  docker compose --project-directory "${PROJECT_ROOT}" stop postgres >/dev/null 2>&1 || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

command -v docker >/dev/null 2>&1 || {
  echo "Docker ou OrbStack est requis pour PostgreSQL." >&2
  exit 1
}

command -v mise >/dev/null 2>&1 || {
  echo "mise est requis. Installez les runtimes avec : mise install" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || {
  echo "curl est requis pour attendre l’API Quarkus." >&2
  exit 1
}

cd "${PROJECT_ROOT}"
docker info >/dev/null 2>&1 || {
  echo "Le moteur Docker n’est pas démarré." >&2
  exit 1
}

echo "→ Démarrage de PostgreSQL 18"
docker compose up -d --wait postgres

echo "→ Démarrage de Quarkus sur http://127.0.0.1:8080"
(
  cd "${PROJECT_ROOT}/backend"
  exec mise exec -- ./mvnw quarkus:dev -Dquarkus.analytics.disabled=true
) &
BACKEND_PID=$!

ready=0
for _attempt in $(seq 1 60); do
  if curl --fail --silent --max-time 1 http://127.0.0.1:8080/q/health/ready >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
    echo "Quarkus s’est arrêté avant de devenir prêt." >&2
    wait "${BACKEND_PID}" || true
    exit 1
  fi
  sleep 1
done

if [[ "${ready}" -ne 1 ]]; then
  echo "Quarkus n’est pas devenu prêt après 60 secondes." >&2
  exit 1
fi

echo "→ Parkventory est prêt sur http://127.0.0.1:5173"
echo "  Arrêtez avec Ctrl-C ; le volume PostgreSQL sera conservé."
mise exec -- npm run dev:frontend
