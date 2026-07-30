#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
VERIFY_PROJECT="parkventory-verify"

cleanup() {
  exit_code=$?
  trap - EXIT INT TERM
  docker compose \
    --project-directory "${PROJECT_ROOT}" \
    --project-name "${VERIFY_PROJECT}" \
    down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

export PARKVENTORY_DB_PORT=0
export PARKVENTORY_API_PORT=0
export PARKVENTORY_WEB_PORT=0

docker compose \
  --project-directory "${PROJECT_ROOT}" \
  --project-name "${VERIFY_PROJECT}" \
  up --build -d --wait --wait-timeout 300

docker compose \
  --project-directory "${PROJECT_ROOT}" \
  --project-name "${VERIFY_PROJECT}" \
  exec -T frontend node -e '
const assertResponse = async (url, check) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  await check(response);
};
Promise.all([
  assertResponse("http://127.0.0.1:5173/", async response => {
    const body = await response.text();
    if (!body.includes("Parkventory")) throw new Error("landing marker missing");
  }),
  assertResponse("http://127.0.0.1:5173/q/health/ready", async response => {
    const body = await response.json();
    if (body.status !== "UP") throw new Error("backend is not ready");
  }),
  assertResponse("http://127.0.0.1:5173/api/v1/dashboard", async response => {
    const body = await response.json();
    if (body.demo !== true) throw new Error("demo contract missing");
  }),
]).catch(error => {
  console.error(error);
  process.exit(1);
});'

echo "Parcours Compose vérifié : PostgreSQL, Quarkus, Vite et proxy API sont sains."
