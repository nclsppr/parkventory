package com.parkventory.auth;

import io.agroal.api.AgroalDataSource;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.ws.rs.ClientErrorException;
import org.junit.jupiter.api.Test;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
@TestProfile(OidcProductionTestProfile.class)
@QuarkusTestResource(value = OidcPostgresTestResource.class, restrictToAnnotatedClass = true)
class OidcIdentityServiceTest {
    private static final String ISSUER = "https://tenant.eu.auth0.test/";

    @Inject
    OidcIdentityService identityService;

    @Inject
    SessionService sessionService;

    @Inject
    AgroalDataSource dataSource;

    @Test
    void productionProfileRemovesBothLocalMagicLinkRoutes() {
        given()
                .contentType("application/json")
                .body("{}")
                .when().post("/api/v1/auth/requests")
                .then().statusCode(404);
        given()
                .contentType("application/json")
                .body("{}")
                .when().post("/api/v1/auth/verify")
                .then().statusCode(404);
        given()
                .when().delete("/api/v1/auth/session")
                .then().statusCode(405);
    }

    @Test
    void provisionsAndReusesTheVerifiedIdentityMembershipAndSessionBridge()
            throws Exception {
        String discriminator = UUID.randomUUID().toString().replace("-", "");
        String email = "alice@" + discriminator + ".test";
        OidcIdentityClaims identity = OidcIdentityClaims.validate(
                ISSUER,
                "email|" + discriminator,
                email,
                Boolean.TRUE,
                ISSUER);

        AuthService.VerifiedSession first = identityService.signIn(identity);
        AuthService.VerifiedSession second = identityService.signIn(identity);

        SessionContext firstSession = sessionService.require(first.rawSessionToken());
        SessionContext secondSession = sessionService.require(second.rawSessionToken());
        assertEquals(firstSession.userId(), secondSession.userId());
        assertEquals(firstSession.membershipId(), secondSession.membershipId());
        assertEquals(firstSession.organizationId(), secondSession.organizationId());
        assertEquals(email, firstSession.normalizedEmail());

        try (var connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     SELECT ua.oidc_subject,
                            count(*) OVER () AS identity_count
                       FROM user_account ua
                       JOIN user_email ue ON ue.user_account_id = ua.id
                      WHERE ue.normalized_email = ?
                     """)) {
            statement.setString(1, email);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                assertNotNull(result.getString("oidc_subject"));
                assertEquals(1, result.getInt("identity_count"));
            }
        }

        OidcIdentityClaims changedEmail = OidcIdentityClaims.validate(
                ISSUER,
                identity.subject(),
                "other@" + discriminator + ".test",
                Boolean.TRUE,
                ISSUER);
        ClientErrorException conflict = assertThrows(
                ClientErrorException.class,
                () -> identityService.signIn(changedEmail));
        assertEquals(409, conflict.getResponse().getStatus());
    }
}
