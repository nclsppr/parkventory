package com.parkventory.dashboard;

import com.parkventory.auth.SessionService;
import com.parkventory.notifications.OutboxDeliveryService;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.MockMailbox;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.function.Predicate;
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
        ownerSession = authenticate(ownerEmail);

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
                .body("availability[0].status", equalTo("UNAVAILABLE"));

        String colleagueSession = authenticate(colleagueEmail);
        String availabilityId = given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("organization.name", equalTo(organizationName(domain)))
                .body("stats.availableSpots", equalTo(1))
                .body("availability[0].status", equalTo("AVAILABLE"))
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

        outbox.deliverNext();
        awaitMessage(ownerEmail, mail -> mail.getSubject().contains("a été réservée"));

        given()
                .cookie(SessionService.COOKIE_NAME, colleagueSession)
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("stats.reservations", equalTo(1))
                .body("stats.availableSpots", equalTo(0))
                .body("availability[0].status", equalTo("RESERVED"));
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

    private String authenticate(String email) {
        given()
                .contentType(ContentType.JSON)
                .body("{\"email\":\"" + email + "\"}")
                .when().post("/api/v1/auth/requests")
                .then()
                .statusCode(202)
                .body("accepted", equalTo(true));
        Mail message = awaitMessages(email, 1).getLast();
        return verify(tokenFrom(message));
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

    private Mail awaitMessage(String email, Predicate<Mail> predicate) {
        for (int attempt = 0; attempt < 40; attempt += 1) {
            for (Mail message : mailbox.getMailsSentTo(email)) {
                if (predicate.test(message)) {
                    return message;
                }
            }
            try {
                Thread.sleep(25);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Attente interrompue.", exception);
            }
        }
        throw new AssertionError("Aucun e-mail correspondant reçu pour " + email);
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
