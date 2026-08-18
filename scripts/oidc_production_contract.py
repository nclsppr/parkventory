#!/usr/bin/env python3
"""Fail-closed static contract for Parkventory's production identity adapter."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


class OidcContractError(ValueError):
    pass


def _read(root: Path, relative: str) -> str:
    path = root / relative
    if not path.is_file():
        raise OidcContractError(f"fichier absent : {relative}")
    return path.read_text(encoding="utf-8")


def _require(text: str, relative: str, *fragments: str) -> None:
    for fragment in fragments:
        if fragment not in text:
            raise OidcContractError(
                f"{relative} ne contient pas le contrat OIDC requis : {fragment}"
            )


def _properties(text: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.partition("=")
        if separator != "=":
            continue
        if key in values:
            raise OidcContractError(f"propriété OIDC dupliquée : {key}")
        values[key] = value
    return values


def validate_oidc_contract(root: Path = ROOT) -> None:
    pom = _read(root, "backend/pom.xml")
    _require(pom, "backend/pom.xml", "<artifactId>quarkus-oidc</artifactId>")

    relative = "backend/src/main/resources/application.properties"
    values = _properties(_read(root, relative))
    expected = {
        "%dev.quarkus.oidc.tenant-enabled": "false",
        "%test.quarkus.oidc.tenant-enabled": "false",
        "%prod.quarkus.oidc.tenant-enabled": "true",
        "%prod.quarkus.oidc.application-type": "web-app",
        "%prod.quarkus.oidc.auth-server-url": "${PARKVENTORY_OIDC_AUTH_SERVER_URL}",
        "%prod.quarkus.oidc.discovery-enabled": "false",
        "%prod.quarkus.oidc.authorization-path": "/authorize",
        "%prod.quarkus.oidc.token-path": "/oauth/token",
        "%prod.quarkus.oidc.jwks-path": "/.well-known/jwks.json",
        "%prod.quarkus.oidc.client-id": "${PARKVENTORY_OIDC_CLIENT_ID}",
        "%prod.quarkus.oidc.credentials.secret": "${PARKVENTORY_OIDC_CLIENT_SECRET}",
        "%prod.quarkus.oidc.authentication.redirect-path": "/api/v1/auth/oidc/callback",
        "%prod.quarkus.oidc.authentication.extra-params.connection": "email",
        "%prod.quarkus.oidc.authentication.extra-params.prompt": "login",
        "%prod.quarkus.oidc.authentication.nonce-required": "true",
        "%prod.quarkus.oidc.authentication.pkce-required": "true",
        "%prod.quarkus.oidc.authentication.state-secret": "${PARKVENTORY_OIDC_STATE_SECRET}",
        "%prod.quarkus.oidc.authentication.fail-on-missing-state-param": "true",
        "%prod.quarkus.oidc.authentication.allow-multiple-code-flows": "false",
        "%prod.quarkus.oidc.authentication.force-redirect-https-scheme": "true",
        "%prod.quarkus.oidc.authentication.cookie-force-secure": "true",
        "%prod.quarkus.oidc.token.issuer": "${PARKVENTORY_OIDC_ISSUER}",
        "%prod.quarkus.oidc.token.audience": "${PARKVENTORY_OIDC_CLIENT_ID}",
        "%prod.quarkus.oidc.token.subject-required": "true",
        "%prod.quarkus.oidc.token.signature-algorithm": "RS256",
        "%prod.quarkus.oidc.token.allow-jwt-introspection": "false",
        "%prod.quarkus.oidc.token.allow-opaque-token-introspection": "false",
        "%prod.quarkus.oidc.token-state-manager.strategy": "id-token",
        "%prod.quarkus.oidc.token-state-manager.encryption-required": "true",
        "%prod.quarkus.oidc.token-state-manager.encryption-secret": "${PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET}",
        "%prod.parkventory.oidc.expected-issuer": "${PARKVENTORY_OIDC_ISSUER}",
    }
    for key, expected_value in expected.items():
        if values.get(key) != expected_value:
            raise OidcContractError(
                f"{relative} doit fixer exactement {key}={expected_value}"
            )

    local_resource_path = "backend/src/main/java/com/parkventory/auth/LocalAuthResource.java"
    local_resource = _read(root, local_resource_path)
    _require(
        local_resource,
        local_resource_path,
        '@UnlessBuildProfile("prod")',
        '@Path("/requests")',
        '@Path("/verify")',
        "@DELETE",
    )
    common_resource_path = "backend/src/main/java/com/parkventory/auth/AuthResource.java"
    common_resource = _read(root, common_resource_path)
    for forbidden in ('@Path("/requests")', '@Path("/verify")', "@DELETE"):
        if forbidden in common_resource:
            raise OidcContractError(
                f"{common_resource_path} réexpose une route magic-link locale"
            )

    oidc_resource_path = "backend/src/main/java/com/parkventory/auth/OidcAuthResource.java"
    oidc_resource = _read(root, oidc_resource_path)
    _require(
        oidc_resource,
        oidc_resource_path,
        '@IfBuildProfile("prod")',
        '@Path("/login")',
        '@Path("/logout")',
        "@Authenticated",
        "OidcIdentityClaims.from(idToken, expectedIssuer)",
        "oidcSession.logout()",
        'HttpHeaders.CACHE_CONTROL, "no-store"',
    )
    oidc_service_path = "backend/src/main/java/com/parkventory/auth/OidcIdentityService.java"
    _require(
        _read(root, oidc_service_path),
        oidc_service_path,
        '@IfBuildProfile("prod")',
        "findOrCreateBoundUser",
        "findOrCreateMembership",
        "INSERT INTO app_session",
    )
    claims_path = "backend/src/main/java/com/parkventory/auth/OidcIdentityClaims.java"
    _require(
        _read(root, claims_path),
        claims_path,
        "expectedIssuer.equals(issuer)",
        "Boolean.TRUE.equals(emailVerified)",
        '"oidc-v1:"',
    )

    compose_path = "deploy/vps/compose.yaml"
    _require(
        _read(root, compose_path),
        compose_path,
        "PARKVENTORY_OIDC_CLIENT_SECRET_FILE: /run/secrets/parkventory_oidc_client_secret",
        "PARKVENTORY_OIDC_STATE_SECRET_FILE: /run/secrets/parkventory_oidc_state_secret",
        "PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET_FILE: /run/secrets/parkventory_oidc_token_encryption_secret",
        "file: /etc/vps/secrets/parkventory/parkventory-oidc-client-secret",
        "file: /etc/vps/secrets/parkventory/parkventory-oidc-state-secret",
        "file: /etc/vps/secrets/parkventory/parkventory-oidc-token-encryption-secret",
    )
    entrypoint_path = "infra/images/backend-entrypoint.sh"
    _require(
        _read(root, entrypoint_path),
        entrypoint_path,
        "PARKVENTORY_OIDC_AUTH_SERVER_URL",
        "PARKVENTORY_OIDC_CLIENT_ID",
        "PARKVENTORY_OIDC_CLIENT_SECRET_FILE",
        "PARKVENTORY_OIDC_ISSUER",
        "PARKVENTORY_OIDC_STATE_SECRET_FILE",
        "PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET_FILE",
        "read_long_secret",
        "OIDC auth server URL and issuer must match exactly",
    )

    dockerfile_path = "infra/images/frontend.Dockerfile"
    _require(_read(root, dockerfile_path), dockerfile_path, "VITE_AUTH_MODE=oidc")
    frontend_config_path = "frontend/src/config.ts"
    _require(
        _read(root, frontend_config_path),
        frontend_config_path,
        'import.meta.env.VITE_AUTH_MODE === "oidc"',
        "/api/v1/auth/oidc/login",
    )
    auth_pages_path = "frontend/src/pages/AuthPages.tsx"
    _require(
        _read(root, auth_pages_path),
        auth_pages_path,
        "isOidcIdentity",
        "Continuer par e-mail",
    )


def main() -> None:
    try:
        validate_oidc_contract()
    except OidcContractError as error:
        raise SystemExit(f"Contrat OIDC de production invalide : {error}") from error
    print("Contrat OIDC de production valide : profils, code flow, claims et secrets.")


if __name__ == "__main__":
    main()
