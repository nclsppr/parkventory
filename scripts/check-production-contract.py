#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import stat
from pathlib import Path

from oidc_production_contract import OidcContractError, validate_oidc_contract


ROOT = Path(__file__).resolve().parent.parent
DIGEST_IMAGE = re.compile(r"^[a-z0-9./_-]+:[A-Za-z0-9_.-]+@sha256:[0-9a-f]{64}$")


def fail(message: str) -> None:
    raise SystemExit(f"Contrat de production Parkventory invalide : {message}")


def require_text(path: str, fragments: tuple[str, ...]) -> str:
    candidate = ROOT / path
    if not candidate.is_file():
        fail(f"fichier absent : {path}")
    text = candidate.read_text(encoding="utf-8")
    for fragment in fragments:
        if fragment not in text:
            fail(f"{path} ne contient pas le contrat requis : {fragment}")
    return text


def image_catalog() -> dict[str, str]:
    path = ROOT / "config/deployment/images.env"
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="ascii").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.partition("=")
        if separator != "=" or not re.fullmatch(r"[A-Z][A-Z0-9_]+", key):
            fail("catalogue d'images illisible")
        if key in values or DIGEST_IMAGE.fullmatch(value) is None:
            fail(f"image mutable ou entrée dupliquée : {key}")
        values[key] = value
    expected = {
        "MAVEN_IMAGE",
        "NGINX_IMAGE",
        "NODE_IMAGE",
        "POSTGRES_TEST_IMAGE",
        "TEMURIN_RUNTIME_IMAGE",
    }
    if set(values) != expected:
        fail("le catalogue d'images n'est pas l'allowlist attendue")
    return values


def validate_dockerfiles() -> None:
    backend = require_text(
        "infra/images/backend.Dockerfile",
        (
            "# syntax=docker/dockerfile:1.24.0@sha256:",
            "ARG MAVEN_IMAGE=scratch",
            "ARG TEMURIN_RUNTIME_IMAGE=scratch",
            'grep -F "Apache Maven 3.9.16"',
            "USER 10001:10001",
            'ENTRYPOINT ["/opt/parkventory/bin/backend-entrypoint"]',
        ),
    )
    frontend = require_text(
        "infra/images/frontend.Dockerfile",
        (
            "# syntax=docker/dockerfile:1.24.0@sha256:",
            "ARG NODE_IMAGE=scratch",
            "ARG NGINX_IMAGE=scratch",
            "VITE_DEMO_MODE=false",
            "USER 101:101",
        ),
    )
    for name, text in {"backend": backend, "frontend": frontend}.items():
        for line in text.splitlines():
            if line.startswith("FROM ") and "${" not in line:
                fail(f"Dockerfile {name} contient une base littérale non contrôlée")


def validate_runtime_contract() -> None:
    require_text(
        "backend/pom.xml",
        ("<artifactId>quarkus-micrometer-registry-prometheus</artifactId>",),
    )
    properties = require_text(
        "backend/src/main/resources/application.properties",
        (
            "%prod.quarkus.flyway.migrate-at-start=false",
            "%prod.quarkus.http.cors.enabled=false",
            "%prod.quarkus.mailer.start-tls=REQUIRED",
            "%prod.parkventory.cookie.secure=true",
        ),
    )
    if "%prod.quarkus.flyway.migrate-at-start=true" in properties:
        fail("le runtime de production active Flyway")
    require_text(
        "infra/images/backend-entrypoint.sh",
        (
            "PARKVENTORY_MIGRATION_ONLY=false",
            "QUARKUS_FLYWAY_MIGRATE_AT_START=false",
            "PARKVENTORY_DB_PASSWORD_FILE",
            "PARKVENTORY_SMTP_PASSWORD_FILE",
        ),
    )
    require_text(
        "infra/images/backend-migrate.sh",
        (
            "PARKVENTORY_MIGRATION_ONLY=true",
            "PARKVENTORY_SMTP_PASSWORD=disabled",
            "QUARKUS_SCHEDULER_ENABLED=false",
            "PARKVENTORY_DB_PASSWORD_FILE",
        ),
    )
    require_text(
        "backend/src/main/java/com/parkventory/MigrationLifecycle.java",
        ("flyway.migrate()", "Quarkus.asyncExit()"),
    )


def validate_integration_sources() -> None:
    template = json.loads(
        (ROOT / "deploy/vps/contract.template.json").read_text(encoding="ascii")
    )
    if template.get("contract") != "parkventory.vps-integration":
        fail("contrat d'intégration inattendu")
    if template.get("source_revision") != "__SOURCE_REVISION__":
        fail("placeholder de révision d'intégration inattendu")
    if template.get("migration") != {
        "entrypoint": "/opt/parkventory/bin/backend-migrate",
        "published_in_backend_image": True,
        "runtime_auto_migrate": False,
    }:
        fail("séparation migrateur/runtime incomplète")
    if template.get("route_owner") != "compose":
        fail("le bundle ne déclare pas son propriétaire de route futur")
    if template.get("compose_file") != "compose.yaml" or template.get(
        "image_variables"
    ) != {
        "backend": "PARKVENTORY_BACKEND_IMAGE",
        "frontend": "PARKVENTORY_FRONTEND_IMAGE",
    }:
        fail("le contrat ne lie pas le Compose aux images applicatives")
    compose = require_text(
        "deploy/vps/compose.yaml",
        (
            "image: ${PARKVENTORY_BACKEND_IMAGE:?",
            "image: ${PARKVENTORY_FRONTEND_IMAGE:?",
            "entrypoint:\n      - /opt/parkventory/bin/backend-migrate",
            "PARKVENTORY_MIGRATION_ONLY: \"false\"",
            "QUARKUS_FLYWAY_MIGRATE_AT_START: \"false\"",
            "file: /etc/vps/secrets/parkventory/",
            "name: app_parkventory",
            "name: db_parkventory",
            "read_only: true",
            "no-new-privileges:true",
            "mem_limit:",
            "pids_limit:",
            "driver: local",
        ),
    )
    for forbidden in ("build:", "ports:", "volumes:", "privileged:", "latest"):
        if re.search(rf"(?m)^\s*{re.escape(forbidden)}", compose):
            fail(f"le Compose applicatif contient une primitive interdite : {forbidden}")
    if compose.count("image: ${PARKVENTORY_BACKEND_IMAGE:?") != 2:
        fail("le backend et le migrateur n'utilisent pas exactement la même image")
    probes_path = ROOT / "deploy/vps/probes.json"
    probes_raw = probes_path.read_bytes()
    probes = json.loads(probes_raw.decode("ascii"))
    canonical_probes = (
        json.dumps(probes, ensure_ascii=True, separators=(",", ":"), sort_keys=True)
        + "\n"
    ).encode("ascii")
    if probes_raw != canonical_probes:
        fail("le contrat de probes n'est pas du JSON canonique compact")
    if probes.get("contract") != "parkventory.probes" or probes.get("schema") != 1:
        fail("contrat de probes invalide")
    paths = {probe["path"] for probe in probes.get("public", [])}
    if "/.well-known/parkventory-release" not in paths:
        fail("probe public de distinction statique/dynamique absente")
    prometheus_targets = json.loads(
        (ROOT / "deploy/vps/prometheus/targets.json").read_text(encoding="ascii")
    )
    if prometheus_targets != [
        {
            "labels": {
                "__metrics_path__": "/q/metrics",
                "application": "parkventory",
                "environment": "production",
            },
            "targets": ["parkventory-backend:8080"],
        }
    ]:
        fail("la cible Prometheus ne pointe pas exactement vers le endpoint Micrometer")


def validate_workflow() -> None:
    workflow = require_text(
        ".github/workflows/application-release.yml",
        (
            "name: Application release",
            "name: Validate application release",
            "name: Publish immutable application release",
            "ghcr.io/${{ github.repository }}/backend",
            "ghcr.io/${{ github.repository }}/frontend",
            'repository="ghcr.io/${GITHUB_REPOSITORY}/vps-integration"',
            'repository="ghcr.io/${GITHUB_REPOSITORY}/application-release"',
            "sbom: true",
            "provenance: mode=max",
            "actions/attest",
            "--deny-self-hosted-runners",
            "Verify the exact pushed image digests",
            "validate-application-release.py",
            "validate-application-release-manifest.py",
        ),
    )
    if "pull_request_target" in workflow or re.search(
        r"runs-on:\s*(?:self-hosted|\[[^\]]*self-hosted)", workflow
    ):
        fail("le workflow de release élargit sa zone de confiance")
    static_workflow = require_text(
        ".github/workflows/vps-release.yml",
        ("Publish immutable VPS artifacts", "parkventory-static-site"),
    )
    if "parkventory/application-release" in static_workflow:
        fail("la démo statique et la release applicative sont couplées")


def validate_executable_scripts() -> None:
    scripts = (
        "scripts/build-application-release.sh",
        "scripts/build-vps-integration.sh",
        "scripts/test-production-images.sh",
        "scripts/validate-application-release.py",
        "scripts/validate-application-release-manifest.py",
    )
    for relative in scripts:
        path = ROOT / relative
        if not path.is_file() or not stat.S_IMODE(path.stat().st_mode) & stat.S_IXUSR:
            fail(f"script absent ou non exécutable : {relative}")


def validate_production_image_wait() -> None:
    image_test = require_text(
        "scripts/test-production-images.sh",
        (
            "postgres_ready=false",
            "--host 127.0.0.1",
            '[[ ${postgres_ready} != true ]]',
            'docker logs --tail 200',
        ),
    )
    readiness_commands = re.findall(
        r'docker exec "\$\{postgres_container\}" pg_isready \\\n'
        r'\s+--host 127\.0\.0\.1 \\\n'
        r'\s+--username postgres',
        image_test,
    )
    if len(readiness_commands) != 1:
        fail("le test d'image doit sonder une fois le PostgreSQL final par TCP")


def main() -> None:
    image_catalog()
    validate_dockerfiles()
    validate_runtime_contract()
    validate_integration_sources()
    validate_workflow()
    validate_executable_scripts()
    validate_production_image_wait()
    try:
        validate_oidc_contract(ROOT)
    except OidcContractError as error:
        fail(str(error))
    print("Contrat producteur Parkventory valide : images, migrateur, intégration et release exactes.")


if __name__ == "__main__":
    main()
