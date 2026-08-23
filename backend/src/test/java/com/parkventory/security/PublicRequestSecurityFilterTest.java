package com.parkventory.security;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicRequestSecurityFilterTest {
    private static final String EXPECTED_ORIGIN = "https://parkventory.test";

    @Test
    void rejectsCrossSiteAndMissingOriginForCookieMutations() {
        assertFalse(PublicRequestSecurityFilter.sameOrigin(
                "POST",
                "https://evil.test",
                "cross-site",
                Set.of("parkventory_session"),
                EXPECTED_ORIGIN));
        assertFalse(PublicRequestSecurityFilter.sameOrigin(
                "POST",
                null,
                null,
                Set.of("parkventory_session"),
                EXPECTED_ORIGIN));
        assertFalse(PublicRequestSecurityFilter.sameOrigin(
                "DELETE",
                null,
                null,
                Set.of("q_session_chunk_1"),
                EXPECTED_ORIGIN));
        assertFalse(PublicRequestSecurityFilter.sameOrigin(
                "POST",
                "https://parkventory.test/forged-path",
                "same-origin",
                Set.of("parkventory_session"),
                EXPECTED_ORIGIN));
    }

    @Test
    void acceptsSameOriginCookieMutationsAndServerSideUnauthenticatedCalls() {
        assertTrue(PublicRequestSecurityFilter.sameOrigin(
                "POST",
                "https://PARKVENTORY.test:443",
                "same-origin",
                Set.of("parkventory_session"),
                EXPECTED_ORIGIN));
        assertTrue(PublicRequestSecurityFilter.sameOrigin(
                "POST",
                null,
                null,
                Set.of(),
                EXPECTED_ORIGIN));
        assertTrue(PublicRequestSecurityFilter.sameOrigin(
                "GET",
                "https://evil.test",
                "cross-site",
                Set.of("parkventory_session"),
                EXPECTED_ORIGIN));
    }

    @Test
    void routesLoginInvitationAndOtherMutationsToSeparateBudgets() {
        assertEquals(
                PublicRequestSecurityFilter.RatePolicy.LOGIN,
                PublicRequestSecurityFilter.classify(
                        "GET", "/api/v1/auth/oidc/login/"));
        assertEquals(
                PublicRequestSecurityFilter.RatePolicy.INVITATION,
                PublicRequestSecurityFilter.classify(
                        "POST", "/api/v1/invitations;source=browser"));
        assertEquals(
                PublicRequestSecurityFilter.RatePolicy.MUTATION,
                PublicRequestSecurityFilter.classify(
                        "POST", "/api/v1/availability/id/reservations"));
        assertNull(PublicRequestSecurityFilter.classify("GET", "/api/v1/dashboard"));
    }
}
