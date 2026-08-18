#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  printf 'Parkventory backend refused: %s\n' "$1" >&2
  exit 78
}

read_secret() {
  local path=$1
  local value=
  local extra=

  [[ -f "${path}" && ! -L "${path}" ]] || fail "secret path is not a regular file"
  exec 3<"${path}"
  IFS= read -r value <&3 || [[ -n "${value}" ]] || fail "secret file is empty"
  if IFS= read -r extra <&3; then
    fail "secret file contains more than one line"
  fi
  exec 3<&-
  LC_ALL=C grep -Eq '^[!-~]{1,512}$' <<<"${value}" \
    || fail "secret file is not a bounded printable value"
  printf '%s' "${value}"
}

read_long_secret() {
  local value
  value=$(read_secret "$1")
  ((${#value} >= 32)) || fail "cryptographic secret must contain at least 32 characters"
  printf '%s' "${value}"
}

require_https_origin() {
  local value=$1
  [[ "${value}" =~ ^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?/$ ]] \
    || fail "$2 must be an HTTPS origin ending with /"
}

[[ "${QUARKUS_PROFILE:-prod}" == prod ]] || fail "runtime profile must be prod"
[[ "${QUARKUS_FLYWAY_MIGRATE_AT_START:-false}" == false ]] \
  || fail "runtime Flyway migration must remain disabled"
[[ "${PARKVENTORY_MIGRATION_ONLY:-false}" == false ]] \
  || fail "runtime must not enter migration-only mode"

: "${PARKVENTORY_JDBC_URL:?PARKVENTORY_JDBC_URL is required}"
: "${PARKVENTORY_DB_USER:?PARKVENTORY_DB_USER is required}"
: "${PARKVENTORY_DB_PASSWORD_FILE:?PARKVENTORY_DB_PASSWORD_FILE is required}"
: "${PARKVENTORY_OIDC_AUTH_SERVER_URL:?PARKVENTORY_OIDC_AUTH_SERVER_URL is required}"
: "${PARKVENTORY_OIDC_CLIENT_ID:?PARKVENTORY_OIDC_CLIENT_ID is required}"
: "${PARKVENTORY_OIDC_CLIENT_SECRET_FILE:?PARKVENTORY_OIDC_CLIENT_SECRET_FILE is required}"
: "${PARKVENTORY_OIDC_ISSUER:?PARKVENTORY_OIDC_ISSUER is required}"
: "${PARKVENTORY_OIDC_STATE_SECRET_FILE:?PARKVENTORY_OIDC_STATE_SECRET_FILE is required}"
: "${PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET_FILE:?PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET_FILE is required}"
: "${PARKVENTORY_SMTP_HOST:?PARKVENTORY_SMTP_HOST is required}"
: "${PARKVENTORY_SMTP_PORT:?PARKVENTORY_SMTP_PORT is required}"
: "${PARKVENTORY_SMTP_USERNAME_FILE:?PARKVENTORY_SMTP_USERNAME_FILE is required}"
: "${PARKVENTORY_SMTP_PASSWORD_FILE:?PARKVENTORY_SMTP_PASSWORD_FILE is required}"
: "${PARKVENTORY_SMTP_FROM:?PARKVENTORY_SMTP_FROM is required}"
: "${PARKVENTORY_WEB_BASE_URL:?PARKVENTORY_WEB_BASE_URL is required}"

require_https_origin "${PARKVENTORY_OIDC_AUTH_SERVER_URL}" PARKVENTORY_OIDC_AUTH_SERVER_URL
require_https_origin "${PARKVENTORY_OIDC_ISSUER}" PARKVENTORY_OIDC_ISSUER
[[ "${PARKVENTORY_OIDC_AUTH_SERVER_URL}" == "${PARKVENTORY_OIDC_ISSUER}" ]] \
  || fail "OIDC auth server URL and issuer must match exactly"
LC_ALL=C grep -Eq '^[!-~]{1,512}$' <<<"${PARKVENTORY_OIDC_CLIENT_ID}" \
  || fail "OIDC client id is not a bounded printable value"

export PARKVENTORY_DB_PASSWORD
PARKVENTORY_DB_PASSWORD=$(read_secret "${PARKVENTORY_DB_PASSWORD_FILE}")
export PARKVENTORY_OIDC_CLIENT_SECRET
PARKVENTORY_OIDC_CLIENT_SECRET=$(read_long_secret "${PARKVENTORY_OIDC_CLIENT_SECRET_FILE}")
export PARKVENTORY_OIDC_STATE_SECRET
PARKVENTORY_OIDC_STATE_SECRET=$(read_long_secret "${PARKVENTORY_OIDC_STATE_SECRET_FILE}")
export PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET
PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET=$(read_long_secret "${PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET_FILE}")
export PARKVENTORY_SMTP_USERNAME
PARKVENTORY_SMTP_USERNAME=$(read_secret "${PARKVENTORY_SMTP_USERNAME_FILE}")
export PARKVENTORY_SMTP_PASSWORD
PARKVENTORY_SMTP_PASSWORD=$(read_secret "${PARKVENTORY_SMTP_PASSWORD_FILE}")
export QUARKUS_FLYWAY_MIGRATE_AT_START=false
export QUARKUS_PROFILE=prod
export PARKVENTORY_MIGRATION_ONLY=false

exec java -jar /opt/parkventory/quarkus-app/quarkus-run.jar
