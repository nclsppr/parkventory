#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
if (( $# > 1 )); then
  echo "Usage: $0 [contrat-postgresql.json]" >&2
  exit 1
fi
CONTRACT_FILE="${1:-${PROJECT_ROOT}/backend/postgres-compatibility.json}"
ACTIVE_CONTAINERS=""

cleanup() {
  for container in ${ACTIVE_CONTAINERS}; do
    docker rm --force "${container}" >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT HUP INT TERM

command -v python3 >/dev/null 2>&1 || {
  echo "Python >= 3.9 est requis pour lire le contrat PostgreSQL." >&2
  exit 1
}

python3 - <<'PY' || {
import sys

raise SystemExit(0 if sys.version_info >= (3, 9) else 1)
PY
  echo "Python >= 3.9 est requis pour lire le contrat PostgreSQL." >&2
  exit 1
}

VARIANT_LINES="$(python3 - "${CONTRACT_FILE}" <<'PY'
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

contract_path = Path(sys.argv[1])
contract = json.loads(contract_path.read_text(encoding="ascii"))
if contract.get("schema") != 1:
    raise SystemExit("Le schéma du contrat PostgreSQL doit être 1.")
if contract.get("productionDecision") != "blocked":
    raise SystemExit("La décision de production PostgreSQL doit rester bloquée.")
variants = contract.get("variants")
if not isinstance(variants, list) or len(variants) != 2:
    raise SystemExit("Le contrat PostgreSQL doit contenir exactement deux variantes.")

expected = {
    "atlas-shared-cluster-candidate": "17.10",
    "canonical-development-baseline": "18.3",
}
seen: set[str] = set()
image_pattern = re.compile(
    r"^docker\.io/library/postgres:[a-zA-Z0-9_.-]+@sha256:[0-9a-f]{64}$"
)
for variant in variants:
    if not isinstance(variant, dict):
        raise SystemExit("Une variante PostgreSQL doit être un objet.")
    role = variant.get("role")
    version = variant.get("version")
    image = variant.get("image")
    if role not in expected or version != expected[role]:
        raise SystemExit("Le rôle ou la version PostgreSQL est inattendu.")
    if role in seen:
        raise SystemExit("Un rôle PostgreSQL est dupliqué.")
    if not isinstance(image, str) or not image_pattern.fullmatch(image):
        raise SystemExit("Chaque image PostgreSQL doit être liée à un digest SHA-256.")
    seen.add(role)
    print(f"{role}\t{version}\t{image}")

if seen != set(expected):
    raise SystemExit("La matrice PostgreSQL est incomplète.")
PY
)" || {
  echo "Le contrat PostgreSQL est invalide : ${CONTRACT_FILE}" >&2
  exit 1
}

if [[ -z "${VARIANT_LINES}" ]]; then
  echo "Le contrat PostgreSQL valide ne peut pas produire une matrice vide." >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || {
  echo "Docker est requis pour la matrice PostgreSQL." >&2
  exit 1
}

docker info >/dev/null 2>&1 || {
  echo "Le moteur Docker doit être démarré pour la matrice PostgreSQL." >&2
  exit 1
}

verify_value() {
  expected="$1"
  actual="$2"
  description="$3"
  if [[ "${actual}" != "${expected}" ]]; then
    echo "Compatibilité PostgreSQL invalide pour ${description}: attendu ${expected}, obtenu ${actual}." >&2
    exit 1
  fi
}

verify_variant() {
  role="$1"
  version="$2"
  image="$3"
  safe_version="$(printf '%s' "${version}" | tr -cd '0-9')"
  container="parkventory-pg-compat-${safe_version}-$$"
  database="parkventory_compat"
  database_password="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"

  echo "Vérification PostgreSQL ${version} (${role})"
  POSTGRES_PASSWORD="${database_password}" docker run \
    --detach \
    --rm \
    --name "${container}" \
    --publish 127.0.0.1::5432 \
    --env POSTGRES_DB="${database}" \
    --env POSTGRES_PASSWORD \
    "${image}" >/dev/null
  ACTIVE_CONTAINERS="${ACTIVE_CONTAINERS} ${container}"

  ready="false"
  for ((_attempt = 1; _attempt <= 60; _attempt += 1)); do
    if docker exec "${container}" \
      psql --tuples-only --no-align --username=postgres --dbname="${database}" \
        --command='SELECT 1' >/dev/null 2>&1; then
      ready="true"
      break
    fi
    sleep 1
  done
  verify_value "true" "${ready}" "le démarrage ${version}"

  actual_version="$(docker exec "${container}" \
    psql --tuples-only --no-align --username=postgres --dbname="${database}" \
      --command='SHOW server_version')"
  verify_value "${version}" "${actual_version}" "la version serveur"

  published_address="$(docker port "${container}" 5432/tcp)"
  host_port="${published_address##*:}"
  if [[ ! "${host_port}" =~ ^[0-9]+$ ]]; then
    echo "Le port PostgreSQL temporaire est illisible." >&2
    exit 1
  fi
  jdbc_url="jdbc:postgresql://127.0.0.1:${host_port}/${database}"

  (
    cd "${PROJECT_ROOT}/backend"
    if command -v mise >/dev/null 2>&1; then
      QUARKUS_DATASOURCE_DEVSERVICES_ENABLED=false \
      QUARKUS_DATASOURCE_JDBC_URL="${jdbc_url}" \
      QUARKUS_DATASOURCE_USERNAME=postgres \
      QUARKUS_DATASOURCE_PASSWORD="${database_password}" \
      QUARKUS_FLYWAY_MIGRATE_AT_START=false \
      QUARKUS_SCHEDULER_ENABLED=false \
      PARKVENTORY_TEST_POSTGRES_VERSION="${version}" \
        mise exec -- ./mvnw test \
          -Dquarkus.analytics.disabled=true \
          -Dparkventory.test.v1=true \
          -Dtest=PostgresV1CompatibilityTest
    else
      QUARKUS_DATASOURCE_DEVSERVICES_ENABLED=false \
      QUARKUS_DATASOURCE_JDBC_URL="${jdbc_url}" \
      QUARKUS_DATASOURCE_USERNAME=postgres \
      QUARKUS_DATASOURCE_PASSWORD="${database_password}" \
      QUARKUS_FLYWAY_MIGRATE_AT_START=false \
      QUARKUS_SCHEDULER_ENABLED=false \
      PARKVENTORY_TEST_POSTGRES_VERSION="${version}" \
        ./mvnw test \
          -Dquarkus.analytics.disabled=true \
          -Dparkventory.test.v1=true \
          -Dtest=PostgresV1CompatibilityTest
    fi
  )

  (
    cd "${PROJECT_ROOT}/backend"
    if command -v mise >/dev/null 2>&1; then
      QUARKUS_DATASOURCE_DEVSERVICES_ENABLED=false \
      QUARKUS_DATASOURCE_JDBC_URL="${jdbc_url}" \
      QUARKUS_DATASOURCE_USERNAME=postgres \
      QUARKUS_DATASOURCE_PASSWORD="${database_password}" \
      PARKVENTORY_TEST_POSTGRES_VERSION="${version}" \
        mise exec -- ./mvnw verify -Dquarkus.analytics.disabled=true
    else
      QUARKUS_DATASOURCE_DEVSERVICES_ENABLED=false \
      QUARKUS_DATASOURCE_JDBC_URL="${jdbc_url}" \
      QUARKUS_DATASOURCE_USERNAME=postgres \
      QUARKUS_DATASOURCE_PASSWORD="${database_password}" \
      PARKVENTORY_TEST_POSTGRES_VERSION="${version}" \
        ./mvnw verify -Dquarkus.analytics.disabled=true
    fi
  )

  runtime_user="parkventory_runtime_${safe_version}_$$"
  runtime_password="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  docker exec -i "${container}" \
    psql --set ON_ERROR_STOP=1 --username=postgres --dbname="${database}" <<SQL
DELETE FROM outbox_dispatch;
DELETE FROM outbox_event;
CREATE ROLE ${runtime_user}
  LOGIN PASSWORD '${runtime_password}'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE ${database} TO ${runtime_user};
GRANT USAGE ON SCHEMA public TO ${runtime_user};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${runtime_user};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${runtime_user};
SQL

  echo "Vérification du parcours Quarkus sous rôle runtime RLS PostgreSQL ${version}"
  (
    cd "${PROJECT_ROOT}/backend"
    if command -v mise >/dev/null 2>&1; then
      QUARKUS_DATASOURCE_DEVSERVICES_ENABLED=false \
      QUARKUS_DATASOURCE_JDBC_URL="${jdbc_url}" \
      QUARKUS_DATASOURCE_USERNAME="${runtime_user}" \
      QUARKUS_DATASOURCE_PASSWORD="${runtime_password}" \
      QUARKUS_FLYWAY_MIGRATE_AT_START=false \
      PARKVENTORY_TEST_POSTGRES_VERSION="${version}" \
        mise exec -- ./mvnw test \
          -Dquarkus.analytics.disabled=true \
          -Dtest=DashboardResourceTest
    else
      QUARKUS_DATASOURCE_DEVSERVICES_ENABLED=false \
      QUARKUS_DATASOURCE_JDBC_URL="${jdbc_url}" \
      QUARKUS_DATASOURCE_USERNAME="${runtime_user}" \
      QUARKUS_DATASOURCE_PASSWORD="${runtime_password}" \
      QUARKUS_FLYWAY_MIGRATE_AT_START=false \
      PARKVENTORY_TEST_POSTGRES_VERSION="${version}" \
        ./mvnw test \
          -Dquarkus.analytics.disabled=true \
          -Dtest=DashboardResourceTest
    fi
  )

  docker rm --force "${container}" >/dev/null
  ACTIVE_CONTAINERS="$(printf '%s' "${ACTIVE_CONTAINERS}" | sed "s/ ${container}//")"
}

variant_count=0
while IFS="$(printf '\t')" read -r role version image; do
  verify_variant "${role}" "${version}" "${image}"
  variant_count=$((variant_count + 1))
done <<<"${VARIANT_LINES}"

verify_value "2" "${variant_count}" "le nombre de variantes exécutées"

echo "Compatibilité PostgreSQL vérifiée sur les deux versions exactes. La décision de production reste bloquée."
