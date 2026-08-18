package com.parkventory.auth;

import jakarta.ws.rs.ClientErrorException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OidcIdentityClaimsTest {
    private static final String ISSUER = "https://tenant.eu.auth0.test/";

    @Test
    void acceptsOnlyAnExactVerifiedProfessionalIdentity() {
        OidcIdentityClaims identity = OidcIdentityClaims.validate(
                ISSUER,
                "email|auth0-subject",
                " Alice@Acme.Test ",
                Boolean.TRUE,
                ISSUER);

        assertEquals("alice@acme.test", identity.normalizedEmail());
        assertEquals("email|auth0-subject", identity.subject());
    }

    @Test
    void rejectsIssuerSubjectAndVerificationDowngrades() {
        assertUnauthorized(() -> OidcIdentityClaims.validate(
                "https://other.eu.auth0.test/",
                "email|subject",
                "alice@acme.test",
                Boolean.TRUE,
                ISSUER));
        assertUnauthorized(() -> OidcIdentityClaims.validate(
                ISSUER,
                "email|subject\nforged",
                "alice@acme.test",
                Boolean.TRUE,
                ISSUER));
        assertUnauthorized(() -> OidcIdentityClaims.validate(
                ISSUER,
                "email|subject",
                "alice@acme.test",
                Boolean.FALSE,
                ISSUER));
        assertUnauthorized(() -> OidcIdentityClaims.validate(
                ISSUER,
                "email|subject",
                "alice@acme.test",
                "true",
                ISSUER));
        assertUnauthorized(() -> OidcIdentityClaims.validate(
                ISSUER,
                "email|subject",
                null,
                Boolean.TRUE,
                ISSUER));
    }

    @Test
    void derivesAnOpaqueIssuerScopedInternalIdentityKey() {
        SecurityTokens tokens = new SecurityTokens();
        OidcIdentityClaims first = OidcIdentityClaims.validate(
                ISSUER,
                "email|same-subject",
                "alice@acme.test",
                Boolean.TRUE,
                ISSUER);
        OidcIdentityClaims otherIssuer = OidcIdentityClaims.validate(
                "https://second.eu.auth0.test/",
                "email|same-subject",
                "alice@acme.test",
                Boolean.TRUE,
                "https://second.eu.auth0.test/");

        String firstKey = first.stableIdentityKey(tokens);
        assertTrue(firstKey.startsWith("oidc-v1:"));
        assertEquals(firstKey, first.stableIdentityKey(tokens));
        assertNotEquals(firstKey, otherIssuer.stableIdentityKey(tokens));
        assertFalse(firstKey.contains(first.subject()));
    }

    private static void assertUnauthorized(Runnable operation) {
        ClientErrorException error = assertThrows(ClientErrorException.class, operation::run);
        assertEquals(401, error.getResponse().getStatus());
    }
}
