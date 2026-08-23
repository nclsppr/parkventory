from __future__ import annotations

import gzip
import hashlib
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
BUILD_INTEGRATION = ROOT / "scripts" / "build-vps-integration.sh"
BUILD_RELEASE = ROOT / "scripts" / "build-application-release.sh"
VALIDATE_RELEASE = ROOT / "scripts" / "validate-application-release.py"
VALIDATE_MANIFEST = ROOT / "scripts" / "validate-application-release-manifest.py"


def run(*args: str, cwd: Path = ROOT, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=cwd,
        check=check,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


class VpsIntegrationTest(unittest.TestCase):
    def test_bundle_is_deterministic_exact_and_revision_bound(self) -> None:
        revision = run("git", "rev-parse", "HEAD").stdout.strip()
        with tempfile.TemporaryDirectory(prefix="parkventory-integration-") as temporary:
            temporary_root = Path(temporary)
            first = temporary_root / "first"
            second = temporary_root / "second"
            run(str(BUILD_INTEGRATION), str(first), revision)
            run(str(BUILD_INTEGRATION), str(second), revision)
            self.assertEqual(
                (first / "integration.tar.gz").read_bytes(),
                (second / "integration.tar.gz").read_bytes(),
            )
            self.assertEqual(
                (first / "inventory.json").read_bytes(),
                (second / "inventory.json").read_bytes(),
            )
            tar_bytes = gzip.decompress((first / "integration.tar.gz").read_bytes())
            self.assertEqual(tar_bytes[257:265], b"ustar\x0000")

            inventory = json.loads((first / "inventory.json").read_text(encoding="ascii"))
            self.assertEqual(
                (first / "inventory.json").read_bytes(),
                (
                    json.dumps(
                        inventory,
                        ensure_ascii=True,
                        separators=(",", ":"),
                        sort_keys=True,
                    )
                    + "\n"
                ).encode("ascii"),
            )
            self.assertEqual(
                inventory["source"],
                {"repository": "nclsppr/parkventory", "revision": revision},
            )
            expected_files = {
                "caddy/parkventory.caddy",
                "compose.yaml",
                "contract.json",
                "migrations.json",
                "probes.json",
                "prometheus/rules.yml",
                "prometheus/targets.json",
            }
            self.assertEqual({item["path"] for item in inventory["files"]}, expected_files)

            with tarfile.open(first / "integration.tar.gz", "r:gz") as archive:
                members = {member.name: member for member in archive.getmembers()}
                expected_members = {"integration", "integration/caddy", "integration/prometheus"}
                expected_members.update(f"integration/{path}" for path in expected_files)
                self.assertEqual(set(members), expected_members)
                for member in members.values():
                    self.assertEqual(member.uid, 0)
                    self.assertEqual(member.gid, 0)
                    self.assertEqual(member.mtime, 0)
                    self.assertFalse(member.issym())
                    self.assertFalse(member.islnk())
                    self.assertEqual(member.mode, 0o755 if member.isdir() else 0o644)
                by_path = {item["path"]: item for item in inventory["files"]}
                for relative in expected_files:
                    content = archive.extractfile(f"integration/{relative}").read()
                    self.assertEqual(by_path[relative]["bytes"], len(content))
                    self.assertEqual(
                        by_path[relative]["sha256"], hashlib.sha256(content).hexdigest()
                    )
                contract = json.load(archive.extractfile("integration/contract.json"))
                migrations = json.load(archive.extractfile("integration/migrations.json"))
                probes_raw = archive.extractfile("integration/probes.json").read()
                probes = json.loads(probes_raw)

            self.assertEqual(contract["source_revision"], revision)
            self.assertFalse(contract["migration"]["runtime_auto_migrate"])
            self.assertEqual(contract["compose_file"], "compose.yaml")
            self.assertEqual(
                contract["image_variables"],
                {
                    "backend": "PARKVENTORY_BACKEND_IMAGE",
                    "frontend": "PARKVENTORY_FRONTEND_IMAGE",
                },
            )
            self.assertEqual(migrations["source_revision"], revision)
            self.assertEqual(
                probes_raw,
                (
                    json.dumps(
                        probes,
                        ensure_ascii=True,
                        separators=(",", ":"),
                        sort_keys=True,
                    )
                    + "\n"
                ).encode("ascii"),
            )
            self.assertEqual(probes["contract"], "parkventory.probes")
            self.assertIn(
                "/.well-known/parkventory-release",
                {probe["path"] for probe in probes["public"]},
            )
            self.assertEqual(
                migrations["migrations"],
                [
                    {
                        "path": "backend/src/main/resources/db/migration/V1__baseline.sql",
                        "sha256": "c106a339e213c99fbda152595af2411bf119c69decd0ec3fe58c494d9faa8935",
                        "version": 1,
                    },
                    {
                        "path": "backend/src/main/resources/db/migration/V2__local_identity_and_offer_integrity.sql",
                        "sha256": "02903ba50a33030ac2ab60a4f5b30725d40f6ce182c37b9b41c05b3cdd5be1ec",
                        "version": 2,
                    },
                    {
                        "path": "backend/src/main/resources/db/migration/V3__tenant_row_level_security.sql",
                        "sha256": "12ff4aa7286aa05ca192a10594d55283c41f40b191c1aa4e77a11faaba8334ca",
                        "version": 3,
                    },
                    {
                        "path": "backend/src/main/resources/db/migration/V4__outbox_aggregate_ordering.sql",
                        "sha256": "d98accc0e841a6eabcf42a4c8abe1b19f247ac58b52acbfcfef13d93ec1de1a2",
                        "version": 4,
                    },
                    {
                        "path": "backend/src/main/resources/db/migration/V5__active_share_management.sql",
                        "sha256": "28a4335b505dab433a3066648217d04a2dee22facb87dd6ffb0eba817904ba4f",
                        "version": 5,
                    },
                ],
            )

    def test_builder_rejects_non_regular_integration_source(self) -> None:
        with tempfile.TemporaryDirectory(prefix="parkventory-integration-negative-") as temporary:
            clone = Path(temporary) / "repository"
            for relative in (
                "scripts/build-vps-integration.sh",
                "deploy/vps",
                "backend/src/main/resources/db/migration",
            ):
                source = ROOT / relative
                target = clone / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                if source.is_dir():
                    shutil.copytree(source, target)
                else:
                    shutil.copy2(source, target)
            run("git", "init", "--quiet", cwd=clone)
            run("git", "config", "user.email", "test@parkventory.invalid", cwd=clone)
            run("git", "config", "user.name", "Parkventory test", cwd=clone)
            run("git", "add", ".", cwd=clone)
            run("git", "commit", "--quiet", "-m", "fixture", cwd=clone)
            route = clone / "deploy/vps/caddy/parkventory.caddy"
            route.unlink()
            os.symlink("contract.template.json", route)
            result = run(
                str(clone / "scripts/build-vps-integration.sh"),
                str(clone / "output"),
                "HEAD",
                cwd=clone,
                check=False,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("not a regular file", result.stderr)

    def test_release_descriptor_accepts_only_expected_digest_references(self) -> None:
        revision = run("git", "rev-parse", "HEAD").stdout.strip()
        digest = "sha256:" + "a" * 64
        with tempfile.TemporaryDirectory(prefix="parkventory-release-") as temporary:
            output = Path(temporary) / "valid"
            run(
                str(BUILD_RELEASE),
                str(output),
                revision,
                f"ghcr.io/nclsppr/parkventory/backend@{digest}",
                f"ghcr.io/nclsppr/parkventory/frontend@{digest}",
                f"ghcr.io/nclsppr/parkventory/vps-integration@{digest}",
                "sha256:" + "b" * 64,
                "sha256:" + "c" * 64,
            )
            raw = (output / "application-release.json").read_bytes()
            self.assertTrue(raw.endswith(b"\n"))
            document = json.loads(raw)
            self.assertEqual(document["source"]["revision"], revision)
            self.assertFalse(document["migrations"]["runtime_auto_migrate"])
            self.assertEqual(document["contract"], "vps-infra.application-release.v1")
            self.assertEqual(document["application"], "parkventory")
            self.assertEqual(
                document["migrations"]["inventory_sha256"], "sha256:" + "b" * 64
            )
            self.assertEqual(
                document["probes"]["inventory_sha256"], "sha256:" + "c" * 64
            )
            self.assertEqual(
                raw,
                (
                    json.dumps(
                        document,
                        ensure_ascii=True,
                        separators=(",", ":"),
                        sort_keys=True,
                    )
                    + "\n"
                ).encode("ascii"),
            )
            run(
                str(VALIDATE_RELEASE),
                str(output / "application-release.json"),
                revision,
                f"ghcr.io/nclsppr/parkventory/backend@{digest}",
                f"ghcr.io/nclsppr/parkventory/frontend@{digest}",
                f"ghcr.io/nclsppr/parkventory/vps-integration@{digest}",
                "sha256:" + "b" * 64,
                "sha256:" + "c" * 64,
            )

            noncanonical = Path(temporary) / "noncanonical.json"
            noncanonical.write_text(json.dumps(document, indent=2), encoding="utf-8")
            rejected = run(
                str(VALIDATE_RELEASE),
                str(noncanonical),
                revision,
                f"ghcr.io/nclsppr/parkventory/backend@{digest}",
                f"ghcr.io/nclsppr/parkventory/frontend@{digest}",
                f"ghcr.io/nclsppr/parkventory/vps-integration@{digest}",
                "sha256:" + "b" * 64,
                "sha256:" + "c" * 64,
                check=False,
            )
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn("not canonical JSON", rejected.stderr)

            invalid = run(
                str(BUILD_RELEASE),
                str(Path(temporary) / "invalid"),
                revision,
                "ghcr.io/nclsppr/parkventory/backend:latest",
                f"ghcr.io/nclsppr/parkventory/frontend@{digest}",
                f"ghcr.io/nclsppr/parkventory/vps-integration@{digest}",
                "sha256:" + "b" * 64,
                "sha256:" + "c" * 64,
                check=False,
            )
            self.assertNotEqual(invalid.returncode, 0)
            self.assertIn("invalid immutable backend reference", invalid.stderr)

    def test_release_manifest_is_bound_to_the_exact_descriptor_and_atlas_shape(self) -> None:
        revision = run("git", "rev-parse", "HEAD").stdout.strip()
        created = "2026-08-17T20:00:00Z"
        descriptor = b'{"contract":"test"}\n'
        with tempfile.TemporaryDirectory(prefix="parkventory-release-manifest-") as temporary:
            temporary_root = Path(temporary)
            descriptor_path = temporary_root / "application-release.json"
            manifest_path = temporary_root / "manifest.json"
            descriptor_path.write_bytes(descriptor)
            manifest = {
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
            raw_manifest = json.dumps(
                manifest, ensure_ascii=True, separators=(",", ":"), sort_keys=True
            ).encode("ascii")
            manifest_path.write_bytes(raw_manifest)
            manifest_digest = "sha256:" + hashlib.sha256(raw_manifest).hexdigest()
            run(
                str(VALIDATE_MANIFEST),
                str(manifest_path),
                str(descriptor_path),
                revision,
                created,
                manifest_digest,
            )
            manifest["annotations"]["unexpected"] = "rejected"
            raw_manifest = json.dumps(
                manifest, ensure_ascii=True, separators=(",", ":"), sort_keys=True
            ).encode("ascii")
            manifest_path.write_bytes(raw_manifest)
            rejected = run(
                str(VALIDATE_MANIFEST),
                str(manifest_path),
                str(descriptor_path),
                revision,
                created,
                "sha256:" + hashlib.sha256(raw_manifest).hexdigest(),
                check=False,
            )
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn("does not match the exact Atlas", rejected.stderr)


if __name__ == "__main__":
    unittest.main()
