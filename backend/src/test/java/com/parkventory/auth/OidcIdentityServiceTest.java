package com.parkventory.auth;

import com.parkventory.notifications.OidcInvitationAccessMailer;
import com.parkventory.tenancy.TenantTransactionContext;
import io.agroal.api.AgroalDataSource;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.MockMailbox;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.ws.rs.ClientErrorException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Inject
    TenantTransactionContext tenantContext;

    @Inject
    SecurityTokens tokens;

    @Inject
    MockMailbox mailbox;

    @Inject
    OidcInvitationAccessMailer invitationAccessMailer;

    @BeforeEach
    void clearMailbox() {
        mailbox.clear();
    }

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
                            count(*) OVER () AS identity_count,
                            (SELECT count(*)
                               FROM app_session session
                              WHERE session.organization_id = ?) AS session_count,
                            (SELECT rolsuper
                               FROM pg_roles
                              WHERE rolname = current_user) AS runtime_superuser,
                            (SELECT rolbypassrls
                               FROM pg_roles
                              WHERE rolname = current_user) AS runtime_bypass_rls,
                            (SELECT count(*)
                               FROM pg_class
                              WHERE relkind = 'r'
                                AND relowner = current_user::regrole) AS runtime_owned_tables
                       FROM user_account ua
                       JOIN user_email ue ON ue.user_account_id = ua.id
                      WHERE ue.normalized_email = ?
                     """)) {
            connection.setAutoCommit(false);
            tenantContext.applyVerifiedIdentity(
                    connection,
                    email,
                    ProfessionalEmail.domain(email));
            tenantContext.applyIdentityUser(connection, firstSession.userId());
            tenantContext.applyTenant(connection, firstSession.organizationId());
            tenantContext.applySession(connection, tokens.hash(first.rawSessionToken()));
            statement.setObject(1, firstSession.organizationId());
            statement.setString(2, email);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                assertNotNull(result.getString("oidc_subject"));
                assertEquals(1, result.getInt("identity_count"));
                assertEquals(1, result.getInt("session_count"));
                assertFalse(result.getBoolean("runtime_superuser"));
                assertFalse(result.getBoolean("runtime_bypass_rls"));
                assertEquals(0, result.getInt("runtime_owned_tables"));
            }
            connection.rollback();
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

    @Test
    void logoutRevokesTheApplicationSessionWithoutAnOidcCookieAndIsIdempotent() {
        String discriminator = UUID.randomUUID().toString().replace("-", "");
        OidcIdentityClaims identity = OidcIdentityClaims.validate(
                ISSUER,
                "email|" + discriminator,
                "logout@" + discriminator + ".test",
                Boolean.TRUE,
                ISSUER);
        AuthService.VerifiedSession verified = identityService.signIn(identity);

        given()
                .cookie(SessionService.COOKIE_NAME, verified.rawSessionToken())
                .header("Origin", "https://evil.test")
                .when().post("/api/v1/auth/oidc/logout")
                .then()
                .statusCode(403);
        assertNotNull(sessionService.require(verified.rawSessionToken()));

        given()
                .cookie(SessionService.COOKIE_NAME, verified.rawSessionToken())
                .when().post("/api/v1/auth/oidc/logout")
                .then()
                .statusCode(403);
        assertNotNull(sessionService.require(verified.rawSessionToken()));

        given()
                .cookie(SessionService.COOKIE_NAME, verified.rawSessionToken())
                .header("Origin", "https://parkventory.test")
                .when().post("/api/v1/auth/oidc/logout")
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true))
                .header("Set-Cookie", containsString("Max-Age=0"))
                .header("Clear-Site-Data", equalTo("\"cookies\""));

        assertThrows(
                ClientErrorException.class,
                () -> sessionService.require(verified.rawSessionToken()));

        given()
                .when().post("/api/v1/auth/oidc/logout")
                .then()
                .statusCode(200)
                .header("Set-Cookie", containsString("Max-Age=0"));
    }

    @Test
    void suspendedAccountsMembershipsAndOrganizationsAreRejectedByOidc() throws Exception {
        String discriminator = UUID.randomUUID().toString().replace("-", "");
        OidcIdentityClaims accountIdentity = OidcIdentityClaims.validate(
                ISSUER,
                "email|suspended-account-" + discriminator,
                "suspended-account@" + discriminator + ".test",
                Boolean.TRUE,
                ISSUER);
        AuthService.VerifiedSession accountSession = identityService.signIn(accountIdentity);
        suspendAccount(accountSession.context());

        ClientErrorException suspendedAccount = assertThrows(
                ClientErrorException.class,
                () -> identityService.signIn(accountIdentity));
        assertEquals(403, suspendedAccount.getResponse().getStatus());

        OidcIdentityClaims membershipIdentity = OidcIdentityClaims.validate(
                ISSUER,
                "email|suspended-membership-" + discriminator,
                "suspended-membership@" + discriminator + ".test",
                Boolean.TRUE,
                ISSUER);
        AuthService.VerifiedSession membershipSession = identityService.signIn(membershipIdentity);
        suspendMembership(membershipSession.context());

        ClientErrorException suspendedMembership = assertThrows(
                ClientErrorException.class,
                () -> identityService.signIn(membershipIdentity));
        assertEquals(403, suspendedMembership.getResponse().getStatus());

        String organizationEmail = "suspended-organization@"
                + UUID.randomUUID().toString().replace("-", "")
                + ".test";
        OidcIdentityClaims organizationIdentity = OidcIdentityClaims.validate(
                ISSUER,
                "email|suspended-organization-" + discriminator,
                organizationEmail,
                Boolean.TRUE,
                ISSUER);
        AuthService.VerifiedSession organizationSession = identityService.signIn(organizationIdentity);
        suspendOrganization(organizationSession.context());

        ClientErrorException existingSession = assertThrows(
                ClientErrorException.class,
                () -> sessionService.require(organizationSession.rawSessionToken()));
        assertEquals(401, existingSession.getResponse().getStatus());
        ClientErrorException suspendedOrganization = assertThrows(
                ClientErrorException.class,
                () -> identityService.signIn(organizationIdentity));
        assertEquals(403, suspendedOrganization.getResponse().getStatus());
    }

    private void suspendAccount(SessionContext session) throws Exception {
        try (var connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     UPDATE user_account
                        SET status = 'SUSPENDED'
                      WHERE id = ?
                     """)) {
            connection.setAutoCommit(false);
            tenantContext.applyIdentityUser(connection, session.userId());
            tenantContext.applyTenant(connection, session.organizationId());
            statement.setObject(1, session.userId());
            assertEquals(1, statement.executeUpdate());
            connection.commit();
        }
    }

    private void suspendMembership(SessionContext session) throws Exception {
        try (var connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     UPDATE membership
                        SET status = 'SUSPENDED'
                      WHERE organization_id = ?
                        AND id = ?
                     """)) {
            connection.setAutoCommit(false);
            tenantContext.applyTenant(connection, session.organizationId());
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            assertEquals(1, statement.executeUpdate());
            connection.commit();
        }
    }

    private void suspendOrganization(SessionContext session) throws Exception {
        try (var connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     UPDATE organization
                        SET mode = 'SUSPENDED'
                      WHERE id = ?
                     """)) {
            connection.setAutoCommit(false);
            tenantContext.applyTenant(connection, session.organizationId());
            statement.setObject(1, session.organizationId());
            assertEquals(1, statement.executeUpdate());
            connection.commit();
        }
    }

    @Test
    void productionInvitationUsesOidcEntryPointWithoutCreatingAMagicLink() throws Exception {
        String email = "invitee@" + UUID.randomUUID().toString().replace("-", "") + ".test";
        try (var connection = dataSource.getConnection()) {
            invitationAccessMailer.send(
                    connection,
                    email,
                    "Alice Martin",
                    "Exemple — communauté");
        }

        assertEquals(1, mailbox.getMailsSentTo(email).size());
        Mail message = mailbox.getMailsSentTo(email).getFirst();
        assertTrue(message.getText().contains(
                "https://parkventory.test/api/v1/auth/oidc/login"));
        assertFalse(message.getText().contains("/auth/callback"));
        assertFalse(message.getText().contains("token="));

        try (var connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "SELECT count(*) FROM magic_link_request")) {
            connection.setAutoCommit(false);
            tenantContext.applyRequestedEmail(connection, email);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                assertEquals(0, result.getInt(1));
            }
            connection.rollback();
        }
    }
}
