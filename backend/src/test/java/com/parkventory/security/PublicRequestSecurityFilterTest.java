package com.parkventory.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicRequestSecurityFilterTest {
    private static final String EXPECTED_ORIGIN = "https://parkventory.test";
    private static final String FORBIDDEN_RESPONSE = "#/components/responses/Forbidden";
    private static final String RATE_LIMITED_RESPONSE =
            "#/components/responses/RateLimited";
    private static final Set<String> UNSAFE_METHODS =
            Set.of("post", "put", "patch", "delete");

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
                PublicRequestSecurityFilter.RatePolicy.LOGIN,
                PublicRequestSecurityFilter.classify(
                        "POST", "/api/v1/auth/requests"));
        assertEquals(
                PublicRequestSecurityFilter.RatePolicy.LOGIN,
                PublicRequestSecurityFilter.classify(
                        "POST", "/api/v1/auth/verify"));
        assertEquals(
                PublicRequestSecurityFilter.RatePolicy.INVITATION,
                PublicRequestSecurityFilter.classify(
                        "POST", "/api/v1/invitations;source=browser"));
        for (String method : List.of("POST", "PUT", "PATCH", "DELETE")) {
            assertEquals(
                    PublicRequestSecurityFilter.RatePolicy.MUTATION,
                    PublicRequestSecurityFilter.classify(
                            method, "/api/v1/future-unsafe-operation"));
        }
        assertNull(PublicRequestSecurityFilter.classify("GET", "/api/v1/dashboard"));
    }

    @Test
    void openApiMatchesEveryProductionRateLimitAndSameOriginPolicy() throws IOException {
        Path specification = Path.of("..", "api", "openapi", "parkventory.yaml");
        if (!Files.isRegularFile(specification)) {
            specification = Path.of("api", "openapi", "parkventory.yaml");
        }
        JsonNode document = new ObjectMapper(new YAMLFactory()).readTree(specification.toFile());
        assertFalse(document.at("/components/responses/RateLimited").isMissingNode());
        assertFalse(document.at("/components/responses/Forbidden").isMissingNode());
        assertEquals(
                366,
                document.at("/components/schemas/Dashboard/properties/activeShares/maxItems").asInt());

        Map<String, String> productionPolicies = new TreeMap<>();
        Set<String> nonProductionOperations = new TreeSet<>();
        for (var pathEntry : document.path("paths").properties()) {
            String path = pathEntry.getKey();
            JsonNode pathItem = pathEntry.getValue();
            String pathProfile = pathItem.path("x-build-profile").asText("");
            for (String method : Set.of("get", "post", "put", "patch", "delete")) {
                JsonNode operation = pathItem.path(method);
                if (operation.isMissingNode()) {
                    continue;
                }
                String operationId = operation.path("operationId").asText();
                assertFalse(operationId.isBlank(), method + " " + path);
                String profile = operation.path("x-build-profile").asText(pathProfile);
                JsonNode responses = operation.path("responses");
                if ("non-prod".equals(profile)) {
                    assertTrue(nonProductionOperations.add(operationId), operationId);
                    assertFalse(responses.has("429"), operationId);
                    assertFalse(FORBIDDEN_RESPONSE.equals(
                            responses.path("403").path("$ref").asText()), operationId);
                    continue;
                }

                PublicRequestSecurityFilter.RatePolicy policy =
                        PublicRequestSecurityFilter.classify(
                                method, "/api/v1" + path);
                assertFalse(productionPolicies.containsKey(operationId), operationId);
                productionPolicies.put(
                        operationId,
                        policy == null ? "NONE" : policy.name());
                assertEquals(policy != null, responses.has("429"), operationId);
                if (policy != null) {
                    assertEquals(
                            RATE_LIMITED_RESPONSE,
                            responses.path("429").path("$ref").asText(),
                            operationId);
                }

                if (UNSAFE_METHODS.contains(method)) {
                    assertEquals(
                            FORBIDDEN_RESPONSE,
                            responses.path("403").path("$ref").asText(),
                            operationId);
                } else {
                    assertFalse(FORBIDDEN_RESPONSE.equals(
                            responses.path("403").path("$ref").asText()), operationId);
                }
            }
        }

        assertEquals(
                Set.of("logout", "requestMagicLink", "verifyMagicLink"),
                nonProductionOperations);
        assertEquals(Map.ofEntries(
                Map.entry("cancelReservation", "MUTATION"),
                Map.entry("completeOidcLogin", "NONE"),
                Map.entry("declareAssignedSpot", "MUTATION"),
                Map.entry("getDashboard", "NONE"),
                Map.entry("getSession", "NONE"),
                Map.entry("inviteColleague", "INVITATION"),
                Map.entry("logoutOidcSession", "MUTATION"),
                Map.entry("reserveSpot", "MUTATION"),
                Map.entry("shareSpot", "MUTATION"),
                Map.entry("startOidcLogin", "LOGIN"),
                Map.entry("withdrawAvailability", "MUTATION")),
                productionPolicies);
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
