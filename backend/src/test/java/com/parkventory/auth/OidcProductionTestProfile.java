package com.parkventory.auth;

import io.quarkus.test.junit.QuarkusTestProfile;

import java.util.Map;

public class OidcProductionTestProfile implements QuarkusTestProfile {
    @Override
    public String getConfigProfile() {
        return "prod";
    }

    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.ofEntries(
                Map.entry("quarkus.datasource.devservices.enabled", "false"),
                Map.entry("quarkus.flyway.migrate-at-start", "true"),
                Map.entry("quarkus.http.test-port", "0"),
                Map.entry("quarkus.mailer.mock", "true"),
                Map.entry("quarkus.oidc.tenant-enabled", "false"),
                Map.entry("parkventory.cookie.secure", "true"),
                Map.entry("parkventory.oidc.expected-issuer", "https://tenant.eu.auth0.test/"),
                Map.entry("parkventory.test.expected-postgres-version", "18.3"),
                Map.entry("PARKVENTORY_OIDC_AUTH_SERVER_URL", "https://tenant.eu.auth0.test/"),
                Map.entry("PARKVENTORY_OIDC_CLIENT_ID", "parkventory-test"),
                Map.entry(
                        "PARKVENTORY_OIDC_CLIENT_SECRET",
                        "oidc-client-secret-test-00000000001"),
                Map.entry("PARKVENTORY_OIDC_ISSUER", "https://tenant.eu.auth0.test/"),
                Map.entry("PARKVENTORY_OIDC_STATE_SECRET", "oidc-state-secret-test-000000000001"),
                Map.entry(
                        "PARKVENTORY_OIDC_TOKEN_ENCRYPTION_SECRET",
                        "oidc-token-secret-test-000000000001"),
                Map.entry("PARKVENTORY_SMTP_FROM", "test@parkventory.invalid"),
                Map.entry("PARKVENTORY_SMTP_HOST", "127.0.0.1"),
                Map.entry("PARKVENTORY_SMTP_PASSWORD", "disabled"),
                Map.entry("PARKVENTORY_SMTP_PORT", "9"),
                Map.entry("PARKVENTORY_SMTP_USERNAME", "disabled"));
    }
}
