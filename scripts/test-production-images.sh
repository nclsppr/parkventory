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
printf '%s\n' 'oidc-client-secret-local-test-000000000001' >"${secret_root}/oidc-client-secret"
printf '%s\n' 'oidc-state-secret-local-test-0000000000001' >"${secret_root}/oidc-state-secret"
printf '%s\n' 'oidc-token-secret-local-test-0000000000001' >"${secret_root}/oidc-token-secret"
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

if missing_oidc_output=$(docker run --rm \
  --platform linux/amd64 \
  --entrypoint java \
  --env PARKVENTORY_DB_PASSWORD=runtime-password-local-test \
  --env PARKVENTORY_DB_USER=parkventory_runtime \
  --env PARKVENTORY_JDBC_URL=jdbc:postgresql://127.0.0.1:9/parkventory \
  --env PARKVENTORY_SMTP_FROM=no-reply@parkventory.test \
  --env PARKVENTORY_SMTP_HOST=127.0.0.1 \
  --env PARKVENTORY_SMTP_PASSWORD=disabled \
  --env PARKVENTORY_SMTP_PORT=2525 \
  --env PARKVENTORY_SMTP_USERNAME=disabled \
  --env PARKVENTORY_WEB_BASE_URL=https://parkventory.test \
  "${backend_image}" \
  -jar /opt/parkventory/quarkus-app/quarkus-run.jar 2>&1); then
  echo "Le backend prod a démarré sans configuration OIDC." >&2
  exit 1
fi
grep -Eq 'parkventory\.oidc\.expected-issuer|PARKVENTORY_OIDC_(AUTH_SERVER_URL|CLIENT_ID|CLIENT_SECRET|ISSUER|STATE_SECRET|TOKEN_ENCRYPTION_SECRET)' \
  <<<"${missing_oidc_output}"

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
  --env PARKVENTORY_OIDC_AUTH_SERVER_URL=https://tenant.eu.auth0.test/ \
  --env PARKVENTORY_OIDC_CLIENT_ID=parkventory-image-test \
  --env PARKVENTORY_OIDC_CLIENT_SECRET_FILE=/run/secrets/oidc-client-secret \
  --env PARKVENTORY_OIDC_ISSUER=https://tenant.eu.auth0.test/ \
  --env PARKVENTORY_OIDC_STATE_SECRET_FILE=/run/secrets/oidc-state-secret \
  --env PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET_FILE=/run/secrets/oidc-token-secret \
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

# Seed one application session as the database owner. The logout probe below
# sends this valid Parkventory cookie together with an invalid Quarkus OIDC
# token-state cookie and must still reach the revocation transaction.
docker exec -i "${postgres_container}" psql \
  --set ON_ERROR_STOP=1 \
  --username postgres \
  --dbname parkventory <<'SQL'
INSERT INTO organization (id, name)
VALUES ('00000000-0000-0000-0000-000000000101', 'Logout image test');
INSERT INTO user_account (id, display_name)
VALUES ('00000000-0000-0000-0000-000000000102', 'Logout image test');
INSERT INTO membership (id, organization_id, user_account_id)
VALUES (
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);
INSERT INTO app_session (
  id,
  user_account_id,
  active_membership_id,
  organization_id,
  token_hash,
  expires_at
) VALUES (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000101',
  '243a223c70bef29c1a5571a740e38f6f4cfb715877ba1e8cbe4f142f9a894165',
  now() + interval '1 day'
);
SQL

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
  --env PARKVENTORY_OIDC_AUTH_SERVER_URL=https://tenant.eu.auth0.test/ \
  --env PARKVENTORY_OIDC_CLIENT_ID=parkventory-image-test \
  --env PARKVENTORY_OIDC_CLIENT_SECRET_FILE=/run/secrets/oidc-client-secret \
  --env PARKVENTORY_OIDC_ISSUER=https://tenant.eu.auth0.test/ \
  --env PARKVENTORY_OIDC_STATE_SECRET_FILE=/run/secrets/oidc-state-secret \
  --env PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET_FILE=/run/secrets/oidc-token-secret \
  --env PARKVENTORY_SMTP_HOST=127.0.0.1 \
  --env PARKVENTORY_SMTP_PORT=2525 \
  --env PARKVENTORY_SMTP_USERNAME_FILE=/run/secrets/smtp-username \
  --env PARKVENTORY_SMTP_PASSWORD_FILE=/run/secrets/smtp-password \
  --env PARKVENTORY_SMTP_FROM=no-reply@parkventory.test \
  --env PARKVENTORY_WEB_BASE_URL=https://parkventory.test \
  --volume "${secret_root}/runtime-password:/run/secrets/postgres-password:ro" \
  --volume "${secret_root}/oidc-client-secret:/run/secrets/oidc-client-secret:ro" \
  --volume "${secret_root}/oidc-state-secret:/run/secrets/oidc-state-secret:ro" \
  --volume "${secret_root}/oidc-token-secret:/run/secrets/oidc-token-secret:ro" \
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

for local_auth_path in /api/v1/auth/requests /api/v1/auth/verify; do
  local_auth_status=$(docker exec -i \
    --env "PROBE_PATH=${local_auth_path}" \
    "${backend_container}" bash -s <<'PROBE'
exec 3<>/dev/tcp/127.0.0.1/8080
printf 'POST %s HTTP/1.0\r\nHost: parkventory.test\r\nContent-Type: application/json\r\nContent-Length: 2\r\n\r\n{}' "${PROBE_PATH}" >&3
IFS= read -r status_line <&3
status_code=${status_line#* }
printf '%s\n' "${status_code%% *}"
PROBE
  )
  [[ ${local_auth_status} == 404 ]]
done

local_logout_status=$(docker exec -i "${backend_container}" bash -s <<'PROBE'
exec 3<>/dev/tcp/127.0.0.1/8080
printf 'DELETE /api/v1/auth/session HTTP/1.0\r\nHost: parkventory.test\r\n\r\n' >&3
IFS= read -r status_line <&3
status_code=${status_line#* }
printf '%s\n' "${status_code%% *}"
PROBE
)
[[ ${local_logout_status} == 405 ]]

oidc_logout_headers=$(docker exec -i "${backend_container}" bash -s <<'PROBE'
exec 3<>/dev/tcp/127.0.0.1/8080
printf 'POST /api/v1/auth/oidc/logout HTTP/1.0\r\nHost: parkventory.test\r\nCookie: parkventory_session=image-logout-session-token; q_session=invalid-token-state\r\n\r\n' >&3
while IFS= read -r line <&3; do
  printf '%s\n' "${line}"
  [[ ${line} == $'\r' ]] && break
done
PROBE
)
grep -Eq '^HTTP/1\.[01] 200' <<<"${oidc_logout_headers}"
grep -Eiq '^set-cookie: parkventory_session=.*Max-Age=0' <<<"${oidc_logout_headers}"
grep -Eiq '^set-cookie: q_session=.*Max-Age=0' <<<"${oidc_logout_headers}"
grep -Eiq '^clear-site-data: "cookies"' <<<"${oidc_logout_headers}"

logout_session_revoked=$(docker exec "${postgres_container}" psql \
  --tuples-only \
  --no-align \
  --username postgres \
  --dbname parkventory \
  --command "SELECT (revoked_at IS NOT NULL)::text FROM app_session WHERE id = '00000000-0000-0000-0000-000000000104'")
[[ ${logout_session_revoked} == "true" ]]

oidc_login_headers=$(docker exec -i "${backend_container}" bash -s <<'PROBE'
exec 3<>/dev/tcp/127.0.0.1/8080
printf 'GET /api/v1/auth/oidc/login HTTP/1.0\r\nHost: parkventory.test\r\n\r\n' >&3
while IFS= read -r line <&3; do
  printf '%s\n' "${line}"
  [[ ${line} == $'\r' ]] && break
done
PROBE
)
grep -Eq '^HTTP/1\.[01] 30[23]' <<<"${oidc_login_headers}"
grep -Eiq '^location: https://tenant\.eu\.auth0\.test/authorize\?' <<<"${oidc_login_headers}"
for oidc_parameter in connection=email prompt=login code_challenge= code_challenge_method=S256 nonce= state=; do
  grep -Fq "${oidc_parameter}" <<<"${oidc_login_headers}"
done

oidc_state_cookie=$(awk '
  tolower($0) ~ /^set-cookie: q_auth=/ {
    sub(/^[^:]*: /, "")
    sub(/;.*/, "")
    gsub(/\r/, "")
    print
    exit
  }
' <<<"${oidc_login_headers}")
oidc_authorize_location=$(awk '
  tolower($0) ~ /^location: / {
    sub(/^[^:]*: /, "")
    gsub(/\r/, "")
    print
    exit
  }
' <<<"${oidc_login_headers}")
[[ ${oidc_state_cookie} == q_auth=* ]]
oidc_callback_state=${oidc_authorize_location#*state=}
oidc_callback_state=${oidc_callback_state%%&*}
[[ -n ${oidc_callback_state} ]]

oidc_callback_headers=$(docker exec -i \
  --env "OIDC_STATE_COOKIE=${oidc_state_cookie}" \
  --env "OIDC_CALLBACK_STATE=${oidc_callback_state}" \
  "${backend_container}" bash -s <<'PROBE'
exec 3<>/dev/tcp/127.0.0.1/8080
printf 'GET /api/v1/auth/oidc/callback?code=image-test-invalid-code&state=%s HTTP/1.0\r\nHost: parkventory.test\r\nCookie: %s\r\n\r\n' \
  "${OIDC_CALLBACK_STATE}" "${OIDC_STATE_COOKIE}" >&3
while IFS= read -r line <&3; do
  printf '%s\n' "${line}"
  [[ ${line} == $'\r' ]] && break
done
PROBE
)
if grep -Eq '^HTTP/1\.[01] 404' <<<"${oidc_callback_headers}"; then
  echo "Le callback virtuel OIDC n'est pas intercepté par le code flow." >&2
  exit 1
fi
grep -Eq '^HTTP/1\.[01] (400|401|500|502|503)' <<<"${oidc_callback_headers}"
grep -Eiq '^set-cookie: q_auth=.*Max-Age=0' <<<"${oidc_callback_headers}"

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

frontend_bundle=$(docker exec "${frontend_container}" sh -c \
  'find /usr/share/nginx/html/assets -maxdepth 1 -type f -name "*.js" -exec cat {} +')
grep -Fq "Continuer par e-mail" <<<"${frontend_bundle}"
if grep -Eq 'Mailpit|serveur local|session locale|Environnement local|PostgreSQL local|Docker Compose' \
  <<<"${frontend_bundle}"; then
  echo "Le frontend OIDC expose du texte réservé au développement local." >&2
  exit 1
fi

echo "Images de production vérifiées : profils OIDC/local, frontend, backend, migrateur dédié et rôle runtime sans DDL."
