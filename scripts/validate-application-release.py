#!/usr/bin/env python3
"""Validate the exact Parkventory descriptor admitted by Atlas."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


MAX_RELEASE_BYTES = 64 * 1024
REVISION_RE = re.compile(r"^[0-9a-f]{40}$")
DIGEST_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
REPOSITORIES = {
    "backend": "ghcr.io/nclsppr/parkventory/backend",
    "frontend": "ghcr.io/nclsppr/parkventory/frontend",
    "integration": "ghcr.io/nclsppr/parkventory/vps-integration",
}


class ContractError(ValueError):
    """The release descriptor is not admissible by Atlas."""


def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ContractError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value: str) -> None:
    raise ContractError(f"JSON constant is forbidden: {value}")


def immutable_reference(value: str, repository: str, label: str) -> str:
    prefix = f"{repository}@"
    if not value.startswith(prefix) or DIGEST_RE.fullmatch(value.removeprefix(prefix)) is None:
        raise ContractError(f"{label} must be an untagged digest reference in {repository}")
    return value


def inventory_digest(value: str, label: str) -> str:
    if DIGEST_RE.fullmatch(value) is None:
        raise ContractError(f"{label} must be sha256 followed by 64 lowercase hex characters")
    return value


def canonical_json(value: object) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        + "\n"
    ).encode("utf-8")


def expected_descriptor(
    revision: str,
    backend_ref: str,
    frontend_ref: str,
    integration_ref: str,
    migrations_sha256: str,
    probes_sha256: str,
) -> dict[str, object]:
    if REVISION_RE.fullmatch(revision) is None:
        raise ContractError("revision must be a full lowercase 40-character Git SHA")
    backend_ref = immutable_reference(backend_ref, REPOSITORIES["backend"], "backend")
    frontend_ref = immutable_reference(frontend_ref, REPOSITORIES["frontend"], "frontend")
    integration_ref = immutable_reference(
        integration_ref, REPOSITORIES["integration"], "integration"
    )
    migrations_sha256 = inventory_digest(migrations_sha256, "migrations inventory")
    probes_sha256 = inventory_digest(probes_sha256, "probes inventory")
    return {
        "schema": 1,
        "contract": "vps-infra.application-release.v1",
        "application": "parkventory",
        "source": {
            "repository": "nclsppr/parkventory",
            "branch": "main",
            "revision": revision,
        },
        "components": {
            "backend": {"source_revision": revision, "image": backend_ref},
            "frontend": {"source_revision": revision, "image": frontend_ref},
        },
        "integration": {
            "source_revision": revision,
            "artifact": integration_ref,
        },
        "migrations": {
            "strategy": "dedicated",
            "runtime_auto_migrate": False,
            "inventory_artifact": integration_ref,
            "inventory_sha256": migrations_sha256,
        },
        "probes": {
            "inventory_artifact": integration_ref,
            "inventory_sha256": probes_sha256,
        },
    }


def validate(path: Path, expected: dict[str, object]) -> None:
    raw = path.read_bytes()
    if not 1 <= len(raw) <= MAX_RELEASE_BYTES:
        raise ContractError("descriptor exceeds the Atlas size limit")
    try:
        value = json.loads(
            raw.decode("utf-8", errors="strict"),
            object_pairs_hook=unique_object,
            parse_constant=reject_constant,
        )
    except (UnicodeDecodeError, json.JSONDecodeError, RecursionError) as exc:
        raise ContractError(f"descriptor is not strict UTF-8 JSON: {exc}") from exc
    if raw != canonical_json(value):
        raise ContractError("descriptor is not canonical JSON with one final newline")
    if value != expected:
        raise ContractError(
            "descriptor does not match the exact Atlas Parkventory contract, repositories, "
            "source revision, component references, or inventory hashes"
        )


def main() -> None:
    if len(sys.argv) != 8:
        raise SystemExit(
            "usage: validate-application-release <descriptor> <revision> <backend-ref> "
            "<frontend-ref> <integration-ref> <migrations-sha256> <probes-sha256>"
        )
    descriptor = Path(sys.argv[1])
    expected = expected_descriptor(*sys.argv[2:])
    validate(descriptor, expected)
    print("Application release conforme au contrat Atlas Parkventory exact.")


if __name__ == "__main__":
    try:
        main()
    except (ContractError, OSError) as exc:
        raise SystemExit(f"Application release invalide : {exc}") from exc
