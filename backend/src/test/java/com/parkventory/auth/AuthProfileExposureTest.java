package com.parkventory.auth;

import io.quarkus.arc.profile.IfBuildProfile;
import io.quarkus.arc.profile.UnlessBuildProfile;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
class AuthProfileExposureTest {
    @Test
    void oidcAdapterIsAbsentOutsideTheProductionBuildProfile() {
        given()
                .redirects().follow(false)
                .when().get("/api/v1/auth/oidc/login")
                .then().statusCode(404);
    }

    @Test
    void localAdapterIsStillPresentInTheTestProfile() {
        given()
                .contentType("application/json")
                .body("{}")
                .when().post("/api/v1/auth/requests")
                .then().statusCode(400);
        given()
                .when().delete("/api/v1/auth/session")
                .then().statusCode(200);
    }

    @Test
    void adapterClassesDeclareMutuallyExclusiveBuildProfiles() {
        assertEquals(
                "prod",
                LocalAuthResource.class.getAnnotation(UnlessBuildProfile.class).value());
        assertEquals(
                "prod",
                OidcAuthResource.class.getAnnotation(IfBuildProfile.class).value());
        assertEquals(
                "prod",
                OidcIdentityService.class.getAnnotation(IfBuildProfile.class).value());
    }
}
