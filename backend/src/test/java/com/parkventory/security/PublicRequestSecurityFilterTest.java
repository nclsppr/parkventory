package com.parkventory.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;
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

    @Test
    void everyMutationUsesTheIpBudgetIndependentlyOfClientCookies() {
        RequestRateLimiter limiter = new RequestRateLimiter();
        PublicRequestSecurityFilter filter = filterWithLimits(limiter, 2);

        assertTrue(filter.acquireBudget(
                PublicRequestSecurityFilter.RatePolicy.MUTATION,
                "192.0.2.10").allowed());
        assertTrue(filter.acquireBudget(
                PublicRequestSecurityFilter.RatePolicy.MUTATION,
                "192.0.2.10").allowed());
        assertEquals(1, limiter.bucketCount());
        assertFalse(filter.acquireBudget(
                PublicRequestSecurityFilter.RatePolicy.MUTATION,
                "192.0.2.10").allowed());
    }

    @Test
    void rotatingWithinAnIpv6PrefixSharesTheSameNetworkBudget() {
        PublicRequestSecurityFilter filter = filterWithLimits(1);

        assertTrue(filter.acquireBudget(
                PublicRequestSecurityFilter.RatePolicy.MUTATION,
                "2001:db8:abcd:1::10").allowed());
        assertFalse(filter.acquireBudget(
                PublicRequestSecurityFilter.RatePolicy.MUTATION,
                "2001:db8:abcd:1::20").allowed());
        assertEquals(
                PublicRequestSecurityFilter.networkSubject("2001:db8:abcd:1::10"),
                PublicRequestSecurityFilter.networkSubject("2001:db8:abcd:1::20"));
    }

    private static PublicRequestSecurityFilter filterWithLimits(int mutationIpLimit) {
        return filterWithLimits(new RequestRateLimiter(), mutationIpLimit);
    }

    private static PublicRequestSecurityFilter filterWithLimits(
            RequestRateLimiter limiter,
            int mutationIpLimit) {
        return new PublicRequestSecurityFilter(
                limiter,
                EXPECTED_ORIGIN,
                120,
                Duration.ofMinutes(10),
                30,
                Duration.ofMinutes(10),
                mutationIpLimit,
                Duration.ofMinutes(1));
    }
}
