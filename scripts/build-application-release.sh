#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
readonly REPOSITORY_ROOT

usage() {
  echo "usage: build-application-release <output-directory> <git-revision> <backend-ref> <frontend-ref> <integration-ref> <migrations-sha256> <probes-sha256>" >&2
  exit 64
}

[[ $# -eq 7 ]] || usage
output_directory=$1
revision=$(git -C "${REPOSITORY_ROOT}" rev-parse --verify "${2}^{commit}")
backend_ref=$3
frontend_ref=$4
integration_ref=$5
migrations_sha256=$6
probes_sha256=$7
[[ ${revision} =~ ^[0-9a-f]{40}$ ]] || {
  echo "revision must resolve to a complete lowercase Git commit" >&2
  exit 1
}
[[ ! -e ${output_directory} ]] || {
  echo "output directory already exists: ${output_directory}" >&2
  exit 1
}

mkdir -p "${output_directory}"

PARKVENTORY_RELEASE_OUTPUT=$(cd "${output_directory}" && pwd -P) \
PARKVENTORY_RELEASE_REVISION=${revision} \
PARKVENTORY_BACKEND_REF=${backend_ref} \
PARKVENTORY_FRONTEND_REF=${frontend_ref} \
PARKVENTORY_INTEGRATION_REF=${integration_ref} \
PARKVENTORY_MIGRATIONS_SHA256=${migrations_sha256} \
PARKVENTORY_PROBES_SHA256=${probes_sha256} \
python3 - <<'PY'
from __future__ import annotations

import json
import os
import re
from pathlib import Path

output = Path(os.environ["PARKVENTORY_RELEASE_OUTPUT"])
revision = os.environ["PARKVENTORY_RELEASE_REVISION"]
references = {
    "backend": os.environ["PARKVENTORY_BACKEND_REF"],
    "frontend": os.environ["PARKVENTORY_FRONTEND_REF"],
    "integration": os.environ["PARKVENTORY_INTEGRATION_REF"],
}
inventory_hashes = {
    "migrations": os.environ["PARKVENTORY_MIGRATIONS_SHA256"],
    "probes": os.environ["PARKVENTORY_PROBES_SHA256"],
}
patterns = {
    "backend": re.compile(r"^ghcr\.io/nclsppr/parkventory/backend@sha256:[0-9a-f]{64}$"),
    "frontend": re.compile(r"^ghcr\.io/nclsppr/parkventory/frontend@sha256:[0-9a-f]{64}$"),
    "integration": re.compile(r"^ghcr\.io/nclsppr/parkventory/vps-integration@sha256:[0-9a-f]{64}$"),
}
for name, reference in references.items():
    if patterns[name].fullmatch(reference) is None:
        raise SystemExit(f"invalid immutable {name} reference")
for name, digest in inventory_hashes.items():
    if re.fullmatch(r"sha256:[0-9a-f]{64}", digest) is None:
        raise SystemExit(f"invalid canonical {name} inventory hash")

document = {
    "application": "parkventory",
    "components": {
        "backend": {"image": references["backend"], "source_revision": revision},
        "frontend": {"image": references["frontend"], "source_revision": revision},
    },
    "contract": "vps-infra.application-release.v1",
    "integration": {"artifact": references["integration"], "source_revision": revision},
    "migrations": {
        "inventory_artifact": references["integration"],
        "inventory_sha256": inventory_hashes["migrations"],
        "runtime_auto_migrate": False,
        "strategy": "dedicated",
    },
    "probes": {
        "inventory_artifact": references["integration"],
        "inventory_sha256": inventory_hashes["probes"],
    },
    "schema": 1,
    "source": {"branch": "main", "repository": "nclsppr/parkventory", "revision": revision},
}
(output / "application-release.json").write_text(
    json.dumps(document, ensure_ascii=True, separators=(",", ":"), sort_keys=True) + "\n",
    encoding="ascii",
)
PY

python3 "${REPOSITORY_ROOT}/scripts/validate-application-release.py" \
  "${output_directory}/application-release.json" \
  "${revision}" \
  "${backend_ref}" \
  "${frontend_ref}" \
  "${integration_ref}" \
  "${migrations_sha256}" \
  "${probes_sha256}"

printf 'revision=%s\n' "${revision}"
printf 'release=%s\n' "${output_directory}/application-release.json"
