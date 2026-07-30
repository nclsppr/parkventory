package com.parkventory.dashboard;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;

@QuarkusTest
class DashboardResourceTest {
    @Test
    void returnsTheLocalDashboard() {
        given()
                .when().get("/api/v1/dashboard")
                .then()
                .statusCode(200)
                .body("demo", equalTo(true))
                .body("user.firstName", equalTo("Nicolas"))
                .body("availability.size()", greaterThan(0));
    }

    @Test
    void acceptsAValidShare() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"spot":"A-24","date":"2026-07-31","from":"08:00","to":"18:00"}
                        """)
                .when().post("/api/v1/shares")
                .then()
                .statusCode(200)
                .body("accepted", equalTo(true));
    }

    @Test
    void rejectsAnInvalidShareWindow() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"spot":"A-24","date":"2026-07-31","from":"18:00","to":"08:00"}
                        """)
                .when().post("/api/v1/shares")
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsPersonalInvitationDomains() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"email\":\"nicolas@gmail.com\"}")
                .when().post("/api/v1/invitations")
                .then()
                .statusCode(400);
    }
}
