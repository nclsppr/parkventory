#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
PROJECT_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd -P)
# shellcheck source=../config/deployment/images.env
source "${PROJECT_ROOT}/config/deployment/images.env"

command -v docker >/dev/null 2>&1 || {
  echo "Docker est requis pour vérifier les images de production." >&2
  exit 1
}
docker info >/dev/null 2>&1 || {
  echo "Le moteur Docker doit être démarré." >&2
  exit 1
}

run_id="$$"
network="parkventory-release-${run_id}"
postgres_container="parkventory-release-postgres-${run_id}"
backend_container="parkventory-release-backend-${run_id}"
frontend_container="parkventory-release-frontend-${run_id}"
backend_image="${PARKVENTORY_BACKEND_TEST_IMAGE:-parkventory-release/backend:${run_id}}"
frontend_image="${PARKVENTORY_FRONTEND_TEST_IMAGE:-parkventory-release/frontend:${run_id}}"
secret_root=$(mktemp -d "${TMPDIR:-/tmp}/parkventory-release-secrets.XXXXXX")

cleanup() {
  exit_code=$?
  trap - EXIT HUP INT TERM
  docker rm --force \
    "${backend_container}" \
    "${frontend_container}" \
    "${postgres_container}" >/dev/null 2>&1 || true
  docker network rm "${network}" >/dev/null 2>&1 || true
  rm -rf -- "${secret_root}"
  exit "${exit_code}"
}
trap cleanup EXIT HUP INT TERM

printf '%s\n' 'runtime-password-local-test' >"${secret_root}/runtime-password"
printf '%s\n' 'migrator-password-local-test' >"${secret_root}/migrator-password"
printf '%s\n' 'smtp-user-local-test' >"${secret_root}/smtp-username"
printf '%s\n' 'smtp-password-local-test' >"${secret_root}/smtp-password"
chmod 0444 "${secret_root}"/*

if [[ "${PARKVENTORY_SKIP_IMAGE_BUILD:-false}" != true ]]; then
  docker buildx build \
    --platform linux/amd64 \
    --load \
    --pull \
    --build-arg "MAVEN_IMAGE=${MAVEN_IMAGE}" \
    --build-arg "TEMURIN_RUNTIME_IMAGE=${TEMURIN_RUNTIME_IMAGE}" \
    --file "${PROJECT_ROOT}/infra/images/backend.Dockerfile" \
    --tag "${backend_image}" \
    "${PROJECT_ROOT}"

  docker buildx build \
    --platform linux/amd64 \
    --load \
    --pull \
    --build-arg "NODE_IMAGE=${NODE_IMAGE}" \
    --build-arg "NGINX_IMAGE=${NGINX_IMAGE}" \
    --file "${PROJECT_ROOT}/infra/images/frontend.Dockerfile" \
    --tag "${frontend_image}" \
    "${PROJECT_ROOT}"
fi

[[ $(docker image inspect --format '{{.Config.User}}' "${backend_image}") == "10001:10001" ]]
[[ $(docker image inspect --format '{{.Config.User}}' "${frontend_image}") == "101:101" ]]
[[ $(docker image inspect --format '{{.Architecture}}' "${backend_image}") == "amd64" ]]
[[ $(docker image inspect --format '{{.Architecture}}' "${frontend_image}") == "amd64" ]]

if runtime_override_output=$(docker run --rm \
  --platform linux/amd64 \
  --env PARKVENTORY_MIGRATION_ONLY=true \
  "${backend_image}" 2>&1); then
  echo "Le runtime a accepté le mode migrateur." >&2
  exit 1
fi
grep -Fq "runtime must not enter migration-only mode" <<<"${runtime_override_output}"

if [[ -n ${PARKVENTORY_EXPECT_IMAGE_REVISION:-} ]]; then
  [[ ${PARKVENTORY_EXPECT_IMAGE_REVISION} =~ ^[0-9a-f]{40}$ ]]
  expected_source="${PARKVENTORY_EXPECT_IMAGE_SOURCE:-https://github.com/nclsppr/parkventory}"
  expected_version="sha-${PARKVENTORY_EXPECT_IMAGE_REVISION}"
  for image in "${backend_image}" "${frontend_image}"; do
    [[ $(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.source"}}' "${image}") == "${expected_source}" ]]
    [[ $(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "${image}") == "${PARKVENTORY_EXPECT_IMAGE_REVISION}" ]]
    [[ $(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' "${image}") == "${expected_version}" ]]
  done
fi

docker network create "${network}" >/dev/null
docker run --detach --rm \
  --name "${postgres_container}" \
  --network "${network}" \
  --network-alias postgres \
  --env POSTGRES_PASSWORD=postgres-local-test \
  "${POSTGRES_TEST_IMAGE}" >/dev/null

postgres_ready=false
for _attempt in {1..60}; do
  if docker exec "${postgres_container}" pg_isready \
    --host 127.0.0.1 \
    --username postgres >/dev/null 2>&1; then
    postgres_ready=true
    break
  fi
  sleep 1
done
if [[ ${postgres_ready} != true ]]; then
  echo "Le serveur PostgreSQL final n'est pas devenu prêt dans le délai imparti." >&2
  docker logs --tail 200 "${postgres_container}" >&2 || true
  exit 1
fi

docker exec -i "${postgres_container}" psql \
  --set ON_ERROR_STOP=1 \
  --username postgres \
  --dbname postgres <<'SQL'
CREATE ROLE parkventory_migrator LOGIN PASSWORD 'migrator-password-local-test';
CREATE ROLE parkventory_runtime LOGIN PASSWORD 'runtime-password-local-test';
CREATE DATABASE parkventory OWNER parkventory_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE parkventory TO parkventory_runtime;
SQL

docker run --rm \
  --platform linux/amd64 \
  --network "${network}" \
  --read-only \
  --tmpfs /tmp:size=32m,mode=1777 \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --entrypoint /opt/parkventory/bin/backend-migrate \
  --env PARKVENTORY_JDBC_URL=jdbc:postgresql://postgres:5432/parkventory \
  --env PARKVENTORY_DB_USER=parkventory_migrator \
  --env PARKVENTORY_DB_PASSWORD_FILE=/run/secrets/postgres-password \
  --volume "${secret_root}/migrator-password:/run/secrets/postgres-password:ro" \
  "${backend_image}"

migration_versions=$(docker exec "${postgres_container}" psql \
  --tuples-only \
  --no-align \
  --username postgres \
  --dbname parkventory \
  --command "SELECT string_agg(version, ',' ORDER BY installed_rank) FROM flyway_schema_history WHERE success")
[[ ${migration_versions} == "1,2,3" ]]

docker exec -i "${postgres_container}" psql \
  --set ON_ERROR_STOP=1 \
  --username postgres \
  --dbname parkventory <<'SQL'
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO parkventory_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO parkventory_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO parkventory_runtime;
SQL

runtime_flags=$(docker exec "${postgres_container}" psql \
  --tuples-only \
  --no-align \
  --username postgres \
  --dbname parkventory \
  --command "SELECT rolsuper::text || ',' || rolbypassrls::text FROM pg_roles WHERE rolname = 'parkventory_runtime'")
[[ ${runtime_flags} == "false,false" ]]

runtime_owned_tables=$(docker exec "${postgres_container}" psql \
  --tuples-only \
  --no-align \
  --username postgres \
  --dbname parkventory \
  --command "SELECT count(*) FROM pg_class WHERE relkind = 'r' AND relowner = 'parkventory_runtime'::regrole")
[[ ${runtime_owned_tables} == "0" ]]

forced_rls_tables=$(docker exec "${postgres_container}" psql \
  --tuples-only \
  --no-align \
  --username postgres \
  --dbname parkventory \
  --command "SELECT count(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relrowsecurity AND relforcerowsecurity")
[[ ${forced_rls_tables} == "17" ]]

if docker exec \
  --env PGPASSWORD=runtime-password-local-test \
  "${postgres_container}" \
  psql --host 127.0.0.1 --username parkventory_runtime --dbname parkventory \
    --command 'CREATE TABLE runtime_must_not_create(id integer)' >/dev/null 2>&1; then
  echo "Le rôle runtime a obtenu un droit DDL interdit." >&2
  exit 1
fi

docker run --detach --rm \
  --platform linux/amd64 \
  --name "${backend_container}" \
  --network "${network}" \
  --network-alias parkventory-backend \
  --read-only \
  --tmpfs /tmp:size=32m,mode=1777 \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --env PARKVENTORY_JDBC_URL=jdbc:postgresql://postgres:5432/parkventory \
  --env PARKVENTORY_DB_USER=parkventory_runtime \
  --env PARKVENTORY_DB_PASSWORD_FILE=/run/secrets/postgres-password \
  --env PARKVENTORY_SMTP_HOST=127.0.0.1 \
  --env PARKVENTORY_SMTP_PORT=2525 \
  --env PARKVENTORY_SMTP_USERNAME_FILE=/run/secrets/smtp-username \
  --env PARKVENTORY_SMTP_PASSWORD_FILE=/run/secrets/smtp-password \
  --env PARKVENTORY_SMTP_FROM=no-reply@parkventory.test \
  --env PARKVENTORY_WEB_BASE_URL=https://parkventory.test \
  --volume "${secret_root}/runtime-password:/run/secrets/postgres-password:ro" \
  --volume "${secret_root}/smtp-username:/run/secrets/smtp-username:ro" \
  --volume "${secret_root}/smtp-password:/run/secrets/smtp-password:ro" \
  "${backend_image}" >/dev/null

for _attempt in {1..90}; do
  if docker exec "${backend_container}" /opt/parkventory/bin/backend-healthcheck >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "${backend_container}" /opt/parkventory/bin/backend-healthcheck >/dev/null

docker run --detach --rm \
  --platform linux/amd64 \
  --name "${frontend_container}" \
  --network "${network}" \
  --network-alias parkventory-frontend \
  --read-only \
  --tmpfs /tmp:size=32m,mode=1777 \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  "${frontend_image}" >/dev/null

for _attempt in {1..30}; do
  if docker exec "${frontend_container}" wget --quiet --output-document=- \
    http://127.0.0.1:8080/__health 2>/dev/null \
    | grep -Fxq parkventory-frontend-v1; then
    break
  fi
  sleep 1
done
docker exec "${frontend_container}" wget --quiet --output-document=- \
  http://127.0.0.1:8080/__health | grep -Fxq parkventory-frontend-v1
docker exec "${frontend_container}" wget --quiet --output-document=- \
  http://127.0.0.1:8080/app | grep -q Parkventory

echo "Images de production vérifiées : frontend, backend, migrateur dédié et rôle runtime sans DDL."
