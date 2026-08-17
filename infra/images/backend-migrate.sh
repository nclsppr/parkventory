#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  printf 'Parkventory migrator refused: %s\n' "$1" >&2
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

: "${PARKVENTORY_JDBC_URL:?PARKVENTORY_JDBC_URL is required}"
: "${PARKVENTORY_DB_USER:?PARKVENTORY_DB_USER is required}"
: "${PARKVENTORY_DB_PASSWORD_FILE:?PARKVENTORY_DB_PASSWORD_FILE is required}"

export PARKVENTORY_DB_PASSWORD
PARKVENTORY_DB_PASSWORD=$(read_secret "${PARKVENTORY_DB_PASSWORD_FILE}")
export PARKVENTORY_MIGRATION_ONLY=true
export PARKVENTORY_SMTP_FROM=migrator@parkventory.invalid
export PARKVENTORY_SMTP_HOST=127.0.0.1
export PARKVENTORY_SMTP_PASSWORD=disabled
export PARKVENTORY_SMTP_PORT=9
export PARKVENTORY_SMTP_USERNAME=disabled
export PARKVENTORY_WEB_BASE_URL=http://127.0.0.1
export QUARKUS_FLYWAY_MIGRATE_AT_START=false
export QUARKUS_HTTP_HOST=127.0.0.1
export QUARKUS_MAILER_MOCK=true
export QUARKUS_PROFILE=prod
export QUARKUS_SCHEDULER_ENABLED=false

exec java -jar /opt/parkventory/quarkus-app/quarkus-run.jar
