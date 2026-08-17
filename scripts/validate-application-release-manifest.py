#!/usr/bin/env python3
"""Validate the exact OCI manifest shape consumed by Atlas."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


MAX_MANIFEST_BYTES = 64 * 1024
DIGEST_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
REVISION_RE = re.compile(r"^[0-9a-f]{40}$")
RFC3339_RE = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}"
    r"(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})$"
)


class ManifestError(ValueError):
    """The OCI manifest differs from the Atlas contract."""


def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ManifestError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value: str) -> None:
    raise ManifestError(f"JSON constant is forbidden: {value}")


def load_manifest(path: Path) -> tuple[bytes, object]:
    raw = path.read_bytes()
    if not 1 <= len(raw) <= MAX_MANIFEST_BYTES:
        raise ManifestError("manifest exceeds the Atlas size limit")
    try:
        value = json.loads(
            raw.decode("utf-8", errors="strict"),
            object_pairs_hook=unique_object,
            parse_constant=reject_constant,
        )
    except (UnicodeDecodeError, json.JSONDecodeError, RecursionError) as exc:
        raise ManifestError(f"manifest is not strict UTF-8 JSON: {exc}") from exc
    return raw, value


def validate(
    manifest_path: Path,
    descriptor_path: Path,
    revision: str,
    created: str,
    expected_manifest_digest: str,
) -> None:
    if REVISION_RE.fullmatch(revision) is None:
        raise ManifestError("revision must be a full lowercase Git SHA")
    if RFC3339_RE.fullmatch(created) is None:
        raise ManifestError("created annotation must be RFC 3339")
    if DIGEST_RE.fullmatch(expected_manifest_digest) is None:
        raise ManifestError("expected manifest digest must be sha256")
    raw, manifest = load_manifest(manifest_path)
    actual_manifest_digest = "sha256:" + hashlib.sha256(raw).hexdigest()
    if actual_manifest_digest != expected_manifest_digest:
        raise ManifestError("fetched manifest bytes do not match the published digest")
    descriptor = descriptor_path.read_bytes()
    expected = {
        "schemaVersion": 2,
        "mediaType": "application/vnd.oci.image.manifest.v1+json",
        "artifactType": "application/vnd.vps-infra.application-release.v1",
        "config": {
            "mediaType": "application/vnd.oci.empty.v1+json",
            "digest": "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a",
            "size": 2,
            "data": "e30=",
        },
        "layers": [
            {
                "mediaType": "application/vnd.vps-infra.application-release.v1+json",
                "digest": "sha256:" + hashlib.sha256(descriptor).hexdigest(),
                "size": len(descriptor),
                "annotations": {
                    "org.opencontainers.image.title": "application-release.json"
                },
            }
        ],
        "annotations": {
            "org.opencontainers.image.source": "https://github.com/nclsppr/parkventory",
            "org.opencontainers.image.revision": revision,
            "org.opencontainers.image.created": created,
        },
    }
    if manifest != expected:
        raise ManifestError(
            "manifest does not match the exact Atlas artifact type, layer, title, "
            "annotations, descriptor digest, or size"
        )


def main() -> None:
    if len(sys.argv) != 6:
        raise SystemExit(
            "usage: validate-application-release-manifest <manifest> <descriptor> "
            "<revision> <created> <manifest-digest>"
        )
    validate(Path(sys.argv[1]), Path(sys.argv[2]), *sys.argv[3:])
    print("Manifeste OCI application-release conforme au contrat Atlas exact.")


if __name__ == "__main__":
    try:
        main()
    except (ManifestError, OSError) as exc:
        raise SystemExit(f"Manifeste application-release invalide : {exc}") from exc
