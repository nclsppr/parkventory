#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
readonly REPOSITORY_ROOT

usage() {
  echo "usage: build-vps-integration <output-directory> <git-revision>" >&2
  exit 64
}

[[ $# -eq 2 ]] || usage
output_directory=$1
revision=$(git -C "${REPOSITORY_ROOT}" rev-parse --verify "${2}^{commit}")
[[ ${revision} =~ ^[0-9a-f]{40}$ ]] || {
  echo "revision must resolve to a complete lowercase Git commit" >&2
  exit 1
}
[[ ! -e ${output_directory} ]] || {
  echo "output directory already exists: ${output_directory}" >&2
  exit 1
}

mkdir -p "${output_directory}"

PARKVENTORY_REPOSITORY_ROOT=${REPOSITORY_ROOT} \
PARKVENTORY_INTEGRATION_OUTPUT=$(cd "${output_directory}" && pwd -P) \
PARKVENTORY_INTEGRATION_REVISION=${revision} \
python3 - <<'PY'
from __future__ import annotations

import gzip
import hashlib
import json
import os
import re
import stat
import tarfile
from pathlib import Path

root = Path(os.environ["PARKVENTORY_REPOSITORY_ROOT"])
output = Path(os.environ["PARKVENTORY_INTEGRATION_OUTPUT"])
revision = os.environ["PARKVENTORY_INTEGRATION_REVISION"]
source_root = root / "deploy" / "vps"
staging = output / "integration"
staging.mkdir(mode=0o755)

source_files = {
    "caddy/parkventory.caddy": source_root / "caddy" / "parkventory.caddy",
    "compose.yaml": source_root / "compose.yaml",
    "prometheus/rules.yml": source_root / "prometheus" / "rules.yml",
    "prometheus/targets.json": source_root / "prometheus" / "targets.json",
    "probes.json": source_root / "probes.json",
}

for relative, source in source_files.items():
    metadata = source.lstat()
    if not stat.S_ISREG(metadata.st_mode):
        raise SystemExit(f"integration source is not a regular file: {source}")
    destination = staging / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(source.read_bytes())

template_path = source_root / "contract.template.json"
if not stat.S_ISREG(template_path.lstat().st_mode):
    raise SystemExit("integration contract template is not a regular file")
contract = json.loads(template_path.read_text(encoding="ascii"))
if contract.get("source_revision") != "__SOURCE_REVISION__":
    raise SystemExit("integration contract template revision placeholder is invalid")
contract["source_revision"] = revision
(staging / "contract.json").write_text(
    json.dumps(contract, ensure_ascii=True, separators=(",", ":"), sort_keys=True) + "\n",
    encoding="ascii",
)

migration_pattern = re.compile(r"^V(?P<version>[1-9][0-9]*)__[a-z0-9_]+\.sql$")
migrations = []
migration_root = root / "backend" / "src" / "main" / "resources" / "db" / "migration"
for path in sorted(migration_root.iterdir()):
    match = migration_pattern.fullmatch(path.name)
    if match is None:
        raise SystemExit(f"unexpected migration path: {path.name}")
    if not stat.S_ISREG(path.lstat().st_mode):
        raise SystemExit(f"migration is not a regular file: {path.name}")
    migrations.append(
        {
            "path": str(path.relative_to(root)),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "version": int(match.group("version")),
        }
    )
if [item["version"] for item in migrations] != list(range(1, len(migrations) + 1)):
    raise SystemExit("migration versions must be contiguous from V1")
migration_inventory = {
    "contract": "parkventory.flyway-migrations",
    "database": "parkventory",
    "migrations": migrations,
    "runtime_auto_migrate": False,
    "schema": 1,
    "source_repository": "nclsppr/parkventory",
    "source_revision": revision,
}
(staging / "migrations.json").write_text(
    json.dumps(
        migration_inventory,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    )
    + "\n",
    encoding="ascii",
)

allowed = {
    "caddy/parkventory.caddy",
    "compose.yaml",
    "contract.json",
    "migrations.json",
    "probes.json",
    "prometheus/rules.yml",
    "prometheus/targets.json",
}
actual = {
    str(path.relative_to(staging))
    for path in staging.rglob("*")
    if path.is_file()
}
if actual != allowed:
    raise SystemExit("integration bundle allowlist mismatch")

files = []
for relative in sorted(allowed):
    path = staging / relative
    content = path.read_bytes()
    files.append(
        {"bytes": len(content), "path": relative, "sha256": hashlib.sha256(content).hexdigest()}
    )

inventory = {
    "contract": "vps-infra.application-integration.v1",
    "files": files,
    "schema": 1,
    "source": {"repository": "nclsppr/parkventory", "revision": revision},
}
(output / "inventory.json").write_text(
    json.dumps(inventory, ensure_ascii=True, separators=(",", ":"), sort_keys=True) + "\n",
    encoding="ascii",
)

tar_path = output / "integration.tar"
with tarfile.open(tar_path, "w", format=tarfile.GNU_FORMAT) as archive:
    for directory in ["integration", "integration/caddy", "integration/prometheus"]:
        info = tarfile.TarInfo(directory)
        info.type = tarfile.DIRTYPE
        info.mode = 0o755
        info.uid = info.gid = 0
        info.mtime = 0
        archive.addfile(info)
    for relative in sorted(allowed):
        path = staging / relative
        info = tarfile.TarInfo(f"integration/{relative}")
        info.mode = 0o644
        info.uid = info.gid = 0
        info.mtime = 0
        info.size = path.stat().st_size
        with path.open("rb") as source:
            archive.addfile(info, source)

archive_path = output / "integration.tar.gz"
with archive_path.open("wb") as raw:
    with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as compressed:
        compressed.write(tar_path.read_bytes())
tar_path.unlink()

for path in sorted(staging.rglob("*"), reverse=True):
    if path.is_file():
        path.unlink()
    else:
        path.rmdir()
staging.rmdir()
PY

printf 'revision=%s\n' "${revision}"
printf 'archive=%s\n' "${output_directory}/integration.tar.gz"
printf 'inventory=%s\n' "${output_directory}/inventory.json"
