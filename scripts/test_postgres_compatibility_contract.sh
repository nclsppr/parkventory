#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/parkventory-pg-contract.XXXXXX")"
INVALID_CONTRACT="${TEST_ROOT}/invalid.json"

cleanup() {
  rm -rf -- "${TEST_ROOT}"
}
trap cleanup EXIT HUP INT TERM

python3 - \
  "${PROJECT_ROOT}/backend/postgres-compatibility.json" \
  "${INVALID_CONTRACT}" <<'PY'
import json
import sys
from pathlib import Path

source = Path(sys.argv[1])
target = Path(sys.argv[2])
contract = json.loads(source.read_text(encoding="ascii"))
contract["productionDecision"] = "blocked"
target.write_text(json.dumps(contract), encoding="ascii")
PY

if output="$("${SCRIPT_DIR}/verify_postgres_compatibility.sh" "${INVALID_CONTRACT}" 2>&1)"; then
  echo "Le vérificateur a accepté un contrat PostgreSQL invalide." >&2
  exit 1
fi

if [[ "${output}" == *"Compatibilité PostgreSQL vérifiée"* ]]; then
  echo "Le vérificateur a annoncé un succès après le rejet du contrat." >&2
  exit 1
fi

if [[ "${output}" != *"La décision de production PostgreSQL doit être sélectionnée."* ]]; then
  echo "Le rejet du contrat ne porte pas le diagnostic attendu." >&2
  exit 1
fi

echo "Contrat PostgreSQL invalide correctement rejeté avant tout appel Docker."
