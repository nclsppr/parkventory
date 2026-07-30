#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
DATABASE_VOLUME="parkventory_parkventory-postgres"

docker compose --project-directory "${PROJECT_ROOT}" down

if ! docker volume inspect "${DATABASE_VOLUME}" >/dev/null 2>&1; then
  echo "Aucun volume PostgreSQL local à supprimer."
  exit 0
fi

docker volume inspect \
  --format '{{ index .Labels "com.docker.compose.project" }} {{ index .Labels "com.docker.compose.volume" }}' \
  "${DATABASE_VOLUME}" | grep -qx 'parkventory parkventory-postgres' || {
    echo "Refus de supprimer un volume sans les labels Parkventory attendus : ${DATABASE_VOLUME}" >&2
    exit 1
  }

docker volume rm "${DATABASE_VOLUME}"
echo "Volume PostgreSQL local supprimé : ${DATABASE_VOLUME}"
