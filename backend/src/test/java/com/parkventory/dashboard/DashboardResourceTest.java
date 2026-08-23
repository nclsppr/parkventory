package com.parkventory.dashboard;

import com.parkventory.auth.SessionService;
import com.parkventory.auth.SessionContext;
import com.parkventory.notifications.OutboxDeliveryService;
import com.parkventory.tenancy.TenantTransactionContext;
import io.agroal.api.AgroalDataSource;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.MockMailbox;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.sql.PreparedStatement;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class DashboardResourceTest {
    private static final Pattern TOKEN_PATTERN = Pattern.compile("token=([A-Za-z0-9_-]+)");

    @Inject
    MockMailbox mailbox;

    @Inject
    OutboxDeliveryService outbox;

    @Inject
    SessionService sessions;

    @Inject
    AgroalDataSource dataSource;

    @Inject
    TenantTransactionContext tenantContext;

    @BeforeEach
    void clearMailbox() {
        mailbox.clear();
    }

    @Test
    void persistsTheAutonomousShareAndReservationFlow() {
        String domain = uniqueDomain();
        String ownerEmail = "alex@" + domain;
        String colleagueEmail = "sam@" + domain;
        String ownerSession = authenticate(ownerEmail);

        given()
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(401);

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("demo", equalTo(false))
                .body("user.firstName", equalTo("Alex"))
                .body("user.assignedSpot", equalTo(null))
                .body("availability", hasSize(0));

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .contentType(ContentType.JSON)
                .body("""
                        {"label":"A 24","level":"Niveau A"}
                        """)
                .when().post("/api/v1/spots")
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true));

        String date = LocalDate.now().plusDays(1).toString();
        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .contentType(ContentType.JSON)
                .body("""
                        {"spot":"A-24","date":"%s","from":"08:00","to":"18:00"}
                        """.formatted(date))
                .when().post("/api/v1/shares")
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true));

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("user.assignedSpot", equalTo("A-24"))
                .body("stats.shares", equalTo(1))
                .body("availability[0].status", equalTo("UNAVAILABLE"))
                .body("availability[0].viewerRelation", equalTo("OFFERED"))
                .body("availability[0].canWithdraw", equalTo(true));

        String colleagueSession = authenticate(colleagueEmail);
        String availabilityId = given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("organization.name", equalTo(organizationName(domain)))
                .body("stats.availableSpots", equalTo(1))
                .body("availability[0].status", equalTo("AVAILABLE"))
                .body("availability[0].viewerRelation", equalTo("NONE"))
                .extract().path("availability[0].id");

        String idempotencyKey = UUID.randomUUID().toString();
        given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .header("Idempotency-Key", idempotencyKey)
                .when().post("/api/v1/availability/{id}/reservations", availabilityId)
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true));

        given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .header("Idempotency-Key", idempotencyKey)
                .when().post("/api/v1/availability/{id}/reservations", availabilityId)
                .then()
                .statusCode(200)
                .body("message", equalTo("Cette réservation avait déjà été confirmée."));

        given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .header("Idempotency-Key", UUID.randomUUID().toString())
                .when().post("/api/v1/availability/{id}/reservations", availabilityId)
                .then()
                .statusCode(409);

        awaitMailWithSubject(ownerEmail, "a été réservée");

        String reservationId = given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("stats.reservations", equalTo(1))
                .body("stats.availableSpots", equalTo(0))
                .body("availability[0].status", equalTo("RESERVED"))
                .body("availability[0].viewerRelation", equalTo("RESERVED"))
                .body("availability[0].canCancel", equalTo(true))
                .extract().path("availability[0].reservationId");

        given()
                .when().delete("/api/v1/reservations/{id}", reservationId)
                .then()
                .statusCode(401);

        given()
                .when().delete("/api/v1/availability/{id}", availabilityId)
                .then()
                .statusCode(401);

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .when().delete("/api/v1/availability/{id}", availabilityId)
                .then()
                .statusCode(409);

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .when().delete("/api/v1/reservations/{id}", reservationId)
                .then()
                .statusCode(403);

        given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .when().delete("/api/v1/reservations/{id}", reservationId)
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true));

        given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .when().delete("/api/v1/reservations/{id}", reservationId)
                .then()
                .statusCode(200)
                .body("message", equalTo("Cette réservation avait déjà été annulée."));

        awaitMailWithSubject(ownerEmail, "a été annulée");

        given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("stats.reservations", equalTo(0))
                .body("stats.availableSpots", equalTo(1))
                .body("availability[0].status", equalTo("AVAILABLE"))
                .body("availability[0].reservationId", equalTo(null));

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .when().delete("/api/v1/availability/{id}", availabilityId)
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true));

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .when().delete("/api/v1/availability/{id}", availabilityId)
                .then()
                .statusCode(200)
                .body("message", equalTo("Cette disponibilité avait déjà été retirée."));

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("availability", hasSize(0));
    }

    @Test
    void invitationTakesPriorityOverTheInviteeDomain() {
        String ownerDomain = uniqueDomain();
        String ownerEmail = "owner@" + ownerDomain;
        String inviteeEmail = "guest@" + uniqueDomain();
        String ownerSession = authenticate(ownerEmail);

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .contentType(ContentType.JSON)
                .body("{\"email\":\"" + inviteeEmail + "\"}")
                .when().post("/api/v1/invitations")
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true));

        outbox.deliverNext();
        Mail invitation = awaitMessages(inviteeEmail, 1).getFirst();
        assertEquals("Votre invitation Parkventory", invitation.getSubject());
        String rawToken = tokenFrom(invitation);
        String inviteeSession = verify(rawToken);

        given()
                .cookie(SessionService.COOKIE_NAME, inviteeSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("organization.name", equalTo(organizationName(ownerDomain)));

        given()
                .contentType(ContentType.JSON)
                .body("{\"token\":\"" + rawToken + "\"}")
                .when().post("/api/v1/auth/verify")
                .then()
                .statusCode(410);
    }

    @Test
    void rejectsInvalidInputsAndConflictingAssignments() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"email\":\"nicolas@gmail.com\"}")
                .when().post("/api/v1/auth/requests")
                .then()
                .statusCode(400);

        String domain = uniqueDomain();
        String firstSession = authenticate("first@" + domain);
        String secondSession = authenticate("second@" + domain);

        given()
                .cookie(SessionService.COOKIE_NAME, firstSession)
                .contentType(ContentType.JSON)
                .body("{\"label\":\"B-18\",\"level\":\"Niveau B\"}")
                .when().post("/api/v1/spots")
                .then()
                .statusCode(200);

        given()
                .cookie(SessionService.COOKIE_NAME, secondSession)
                .contentType(ContentType.JSON)
                .body("{\"label\":\"B-18\",\"level\":\"Niveau B\"}")
                .when().post("/api/v1/spots")
                .then()
                .statusCode(409);

        given()
                .cookie(SessionService.COOKIE_NAME, firstSession)
                .contentType(ContentType.JSON)
                .body("""
                        {"spot":"B-18","date":"%s","from":"18:00","to":"08:00"}
                        """.formatted(LocalDate.now().plusDays(1)))
                .when().post("/api/v1/shares")
                .then()
                .statusCode(400);
    }

    @Test
    void suspendedAccountsAndMembershipsCannotBeReactivatedByLocalSignIn()
            throws Exception {
        String accountEmail = "suspended-account@" + uniqueDomain();
        String accountToken = authenticate(accountEmail);
        SessionContext account = sessions.require(accountToken);
        suspendAccount(account);

        String suspendedAccountLink = requestMagicLink(accountEmail);
        given()
                .contentType(ContentType.JSON)
                .body("{\"token\":\"" + suspendedAccountLink + "\"}")
                .when().post("/api/v1/auth/verify")
                .then()
                .statusCode(403);

        String membershipEmail = "suspended-membership@" + uniqueDomain();
        String membershipToken = authenticate(membershipEmail);
        SessionContext membership = sessions.require(membershipToken);
        suspendMembership(membership);

        String suspendedMembershipLink = requestMagicLink(membershipEmail);
        given()
                .contentType(ContentType.JSON)
                .body("{\"token\":\"" + suspendedMembershipLink + "\"}")
                .when().post("/api/v1/auth/verify")
                .then()
                .statusCode(403);
    }

    @Test
    void invitationQuotaIsBoundToTheAuthenticatedMembership() {
        String ownerSession = authenticate("quota-owner@" + uniqueDomain());

        for (int index = 0; index < 2; index += 1) {
            given()
                    .cookie(SessionService.COOKIE_NAME, ownerSession)
                    .contentType(ContentType.JSON)
                    .body("{\"email\":\"invitee-" + index + "@" + uniqueDomain() + "\"}")
                    .when().post("/api/v1/invitations")
                    .then()
                    .statusCode(200);
        }

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .contentType(ContentType.JSON)
                .body("{\"email\":\"invitee-over-quota@" + uniqueDomain() + "\"}")
                .when().post("/api/v1/invitations")
                .then()
                .statusCode(429);
    }

    @Test
    void arbitratesTwoConcurrentReservationsInPostgres() throws Exception {
        String domain = uniqueDomain();
        String ownerEmail = "owner@" + domain;
        String ownerSession = authenticate(ownerEmail);
        String firstSession = authenticate("first@" + domain);
        String secondSession = authenticate("second@" + domain);

        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .contentType(ContentType.JSON)
                .body("{\"label\":\"C-12\",\"level\":\"Niveau C\"}")
                .when().post("/api/v1/spots")
                .then()
                .statusCode(200);
        given()
                .cookie(SessionService.COOKIE_NAME, ownerSession)
                .contentType(ContentType.JSON)
                .body("""
                        {"spot":"C-12","date":"%s","from":"08:00","to":"18:00"}
                        """.formatted(LocalDate.now().plusDays(2)))
                .when().post("/api/v1/shares")
                .then()
                .statusCode(200);

        String availabilityId = given()
                .cookie(SessionService.COOKIE_NAME, firstSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .extract().path("availability[0].id");

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> first = executor.submit(() -> reserveConcurrently(
                    firstSession,
                    availabilityId,
                    ready,
                    start));
            Future<Integer> second = executor.submit(() -> reserveConcurrently(
                    secondSession,
                    availabilityId,
                    ready,
                    start));
            assertTrue(ready.await(5, TimeUnit.SECONDS), "Les deux requêtes doivent être prêtes.");
            start.countDown();

            List<Integer> statuses = List.of(
                            first.get(10, TimeUnit.SECONDS),
                            second.get(10, TimeUnit.SECONDS))
                    .stream()
                    .sorted(Comparator.naturalOrder())
                    .toList();
            assertEquals(List.of(200, 409), statuses);
        } finally {
            start.countDown();
            executor.shutdownNow();
        }

        Mail confirmation = awaitMailWithSubject(ownerEmail, "a été réservée");
        assertTrue(confirmation.getText().contains("C-12"));
        long confirmationCount = mailbox.getMailsSentTo(ownerEmail).stream()
                .filter(mail -> mail.getSubject().contains("a été réservée"))
                .count();
        assertEquals(1, confirmationCount);
    }

    private int reserveConcurrently(
            String session,
            String availabilityId,
            CountDownLatch ready,
            CountDownLatch start) throws InterruptedException {
        ready.countDown();
        if (!start.await(5, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Le départ concurrent n’a pas été libéré.");
        }
        return given()
                .cookie(SessionService.COOKIE_NAME, session)
                .header("Idempotency-Key", UUID.randomUUID().toString())
                .when().post("/api/v1/availability/{id}/reservations", availabilityId)
                .statusCode();
    }

    private String authenticate(String email) {
        String rawToken = requestMagicLink(email);
        return verify(rawToken);
    }

    private String requestMagicLink(String email) {
        given()
                .contentType(ContentType.JSON)
                .body("{\"email\":\"" + email + "\"}")
                .when().post("/api/v1/auth/requests")
                .then()
                .statusCode(202)
                .body("accepted", equalTo(true));
        Mail message = awaitMessages(email, 1).getLast();
        return tokenFrom(message);
    }

    private String verify(String rawToken) {
        String setCookie = given()
                .contentType(ContentType.JSON)
                .body("{\"token\":\"" + rawToken + "\"}")
                .when().post("/api/v1/auth/verify")
                .then()
                .statusCode(200)
                .body("authenticated", equalTo(true))
                .extract().header("Set-Cookie");
        return setCookie
                .substring((SessionService.COOKIE_NAME + "=").length())
                .split(";", 2)[0];
    }

    private Mail awaitMailWithSubject(String email, String subjectFragment) {
        for (int attempt = 0; attempt < 80; attempt += 1) {
            for (Mail mail : mailbox.getMailsSentTo(email)) {
                if (mail.getSubject().contains(subjectFragment)) {
                    return mail;
                }
            }
            outbox.deliverNext();
            try {
                Thread.sleep(25);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Attente interrompue.", exception);
            }
        }
        throw new AssertionError(
                "Aucun e-mail contenant « " + subjectFragment + " » reçu pour " + email);
    }

    private List<Mail> awaitMessages(String email, int minimum) {
        for (int attempt = 0; attempt < 40; attempt += 1) {
            List<Mail> messages = mailbox.getMailsSentTo(email);
            if (messages.size() >= minimum) {
                return messages;
            }
            try {
                Thread.sleep(25);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Attente interrompue.", exception);
            }
        }
        throw new AssertionError("Aucun e-mail reçu pour " + email);
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

    private static String tokenFrom(Mail mail) {
        Matcher matcher = TOKEN_PATTERN.matcher(mail.getText());
        assertTrue(matcher.find(), "Le lien magique doit contenir un token.");
        return matcher.group(1);
    }

    private static String uniqueDomain() {
        return "park" + UUID.randomUUID().toString().replace("-", "").substring(0, 12) + ".test";
    }

    private static String organizationName(String domain) {
        String label = domain.substring(0, domain.indexOf('.'));
        return label.substring(0, 1).toUpperCase() + label.substring(1) + " — communauté";
    }
}
