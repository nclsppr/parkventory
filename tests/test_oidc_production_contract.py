from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from oidc_production_contract import OidcContractError, validate_oidc_contract


FILES = (
    "backend/pom.xml",
    "backend/src/main/resources/application.properties",
    "backend/src/main/java/com/parkventory/auth/AuthResource.java",
    "backend/src/main/java/com/parkventory/auth/LocalAuthResource.java",
    "backend/src/main/java/com/parkventory/auth/OidcAuthResource.java",
    "backend/src/main/java/com/parkventory/auth/OidcIdentityClaims.java",
    "backend/src/main/java/com/parkventory/auth/OidcIdentityService.java",
    "deploy/vps/compose.yaml",
    "frontend/src/config.ts",
    "frontend/src/pages/AuthPages.tsx",
    "infra/images/backend-entrypoint.sh",
    "infra/images/frontend.Dockerfile",
)


class OidcProductionContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        for relative in FILES:
            source = ROOT / relative
            destination = self.root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def replace(self, relative: str, old: str, new: str) -> None:
        path = self.root / relative
        text = path.read_text(encoding="utf-8")
        self.assertIn(old, text)
        path.write_text(text.replace(old, new, 1), encoding="utf-8")

    def assert_rejected(self) -> None:
        with self.assertRaises(OidcContractError):
            validate_oidc_contract(self.root)

    def test_current_contract_is_complete(self) -> None:
        validate_oidc_contract(self.root)

    def test_rejects_local_routes_exposed_in_production(self) -> None:
        self.replace(
            "backend/src/main/java/com/parkventory/auth/LocalAuthResource.java",
            '@UnlessBuildProfile("prod")',
            "// profile guard removed",
        )
        self.assert_rejected()

    def test_rejects_oidc_routes_exposed_outside_production(self) -> None:
        self.replace(
            "backend/src/main/java/com/parkventory/auth/OidcAuthResource.java",
            '@IfBuildProfile("prod")',
            "// profile guard removed",
        )
        self.assert_rejected()

    def test_rejects_pkce_downgrade(self) -> None:
        self.replace(
            "backend/src/main/resources/application.properties",
            "%prod.quarkus.oidc.authentication.pkce-required=true",
            "%prod.quarkus.oidc.authentication.pkce-required=false",
        )
        self.assert_rejected()

    def test_rejects_string_email_verification(self) -> None:
        self.replace(
            "backend/src/main/java/com/parkventory/auth/OidcIdentityClaims.java",
            "Boolean.TRUE.equals(emailVerified)",
            '"true".equals(String.valueOf(emailVerified))',
        )
        self.assert_rejected()

    def test_rejects_missing_compose_secret(self) -> None:
        self.replace(
            "deploy/vps/compose.yaml",
            "PARKVENTORY_OIDC_CLIENT_SECRET_FILE: /run/secrets/parkventory_oidc_client_secret",
            "# client secret removed",
        )
        self.assert_rejected()

    def test_rejects_local_frontend_in_production_image(self) -> None:
        self.replace(
            "infra/images/frontend.Dockerfile",
            "VITE_AUTH_MODE=oidc",
            "VITE_AUTH_MODE=local",
        )
        self.assert_rejected()


if __name__ == "__main__":
    unittest.main()
