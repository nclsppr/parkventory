from __future__ import annotations

import json
import os
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
COMPOSE = ROOT / "deploy" / "vps" / "compose.yaml"
REVISION = "a" * 40
BACKEND_REF = "ghcr.io/nclsppr/parkventory/backend@sha256:" + "b" * 64
FRONTEND_REF = "ghcr.io/nclsppr/parkventory/frontend@sha256:" + "c" * 64


class VpsComposeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        environment = os.environ.copy()
        environment.update(
            {
                "PARKVENTORY_BACKEND_IMAGE": BACKEND_REF,
                "PARKVENTORY_DB_MIGRATOR_USER": "parkventory_migrator",
                "PARKVENTORY_DB_RUNTIME_USER": "parkventory_runtime",
                "PARKVENTORY_FRONTEND_IMAGE": FRONTEND_REF,
                "PARKVENTORY_JDBC_URL": "jdbc:postgresql://postgres:5432/parkventory",
                "PARKVENTORY_OIDC_AUTH_SERVER_URL": "https://tenant.eu.auth0.test/",
                "PARKVENTORY_OIDC_CLIENT_ID": "parkventory-compose-test",
                "PARKVENTORY_OIDC_ISSUER": "https://tenant.eu.auth0.test/",
                "PARKVENTORY_SMTP_FROM": "no-reply@parkventory.test",
                "PARKVENTORY_SMTP_HOST": "smtp.parkventory.test",
                "PARKVENTORY_SMTP_PORT": "587",
                "PARKVENTORY_WEB_BASE_URL": "https://parkventory.test",
            }
        )
        result = subprocess.run(
            [
                "docker",
                "compose",
                "--profile",
                "migration",
                "--file",
                str(COMPOSE),
                "config",
                "--format",
                "json",
            ],
            cwd=ROOT,
            env=environment,
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        cls.model = json.loads(result.stdout)

    def test_app_only_service_allowlist_and_exact_images(self) -> None:
        services = self.model["services"]
        self.assertEqual(set(services), {"backend", "frontend", "migrator"})
        self.assertEqual(services["backend"]["image"], BACKEND_REF)
        self.assertEqual(services["migrator"]["image"], BACKEND_REF)
        self.assertEqual(services["frontend"]["image"], FRONTEND_REF)
        for service in services.values():
            self.assertNotIn("build", service)
            self.assertNotIn("ports", service)
            self.assertNotIn("volumes", service)
            self.assertTrue(service["read_only"])
            self.assertEqual(service["cap_drop"], ["ALL"])
            self.assertEqual(service["security_opt"], ["no-new-privileges:true"])
            self.assertEqual(service["logging"]["driver"], "local")
            self.assertGreater(service["cpus"], 0)
            self.assertGreater(int(service["mem_limit"]), 0)
            self.assertGreater(service["pids_limit"], 0)

    def test_migrator_is_one_shot_and_runtime_cannot_auto_migrate(self) -> None:
        services = self.model["services"]
        migrator = services["migrator"]
        backend = services["backend"]
        self.assertEqual(migrator["profiles"], ["migration"])
        self.assertEqual(
            migrator["entrypoint"], ["/opt/parkventory/bin/backend-migrate"]
        )
        self.assertEqual(migrator["restart"], "no")
        self.assertEqual(set(migrator["networks"]), {"db_parkventory"})
        self.assertEqual(
            backend["environment"]["QUARKUS_FLYWAY_MIGRATE_AT_START"], "false"
        )
        self.assertEqual(backend["environment"]["PARKVENTORY_MIGRATION_ONLY"], "false")
        self.assertEqual(
            backend["healthcheck"]["test"],
            ["CMD", "/opt/parkventory/bin/backend-healthcheck"],
        )

    def test_external_networks_and_file_secrets_are_exact(self) -> None:
        self.assertEqual(
            {name: item["name"] for name, item in self.model["networks"].items()},
            {
                "app_parkventory": "app_parkventory",
                "db_parkventory": "db_parkventory",
            },
        )
        self.assertTrue(all(item["external"] for item in self.model["networks"].values()))
        self.assertEqual(
            {name: item["name"] for name, item in self.model["secrets"].items()},
            {
                "parkventory_postgres_migrator_password": "parkventory_postgres_migrator_password",
                "parkventory_postgres_runtime_password": "parkventory_postgres_runtime_password",
                "parkventory_oidc_client_secret": "parkventory_oidc_client_secret",
                "parkventory_oidc_state_secret": "parkventory_oidc_state_secret",
                "parkventory_oidc_token_encryption_secret": "parkventory_oidc_token_encryption_secret",
                "parkventory_smtp_password": "parkventory_smtp_password",
                "parkventory_smtp_username": "parkventory_smtp_username",
            },
        )
        for name, item in self.model["secrets"].items():
            self.assertEqual(
                item["file"],
                f"/etc/vps/secrets/parkventory/{name.replace('_', '-')}",
            )
        backend_targets = {
            item["target"] for item in self.model["services"]["backend"]["secrets"]
        }
        self.assertEqual(
            backend_targets,
            {
                "/run/secrets/parkventory_postgres_runtime_password",
                "/run/secrets/parkventory_oidc_client_secret",
                "/run/secrets/parkventory_oidc_state_secret",
                "/run/secrets/parkventory_oidc_token_encryption_secret",
                "/run/secrets/parkventory_smtp_password",
                "/run/secrets/parkventory_smtp_username",
            },
        )


if __name__ == "__main__":
    unittest.main()
