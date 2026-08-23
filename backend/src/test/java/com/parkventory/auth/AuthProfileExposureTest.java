package com.parkventory.auth;

import com.parkventory.notifications.LocalInvitationAccessMailer;
import com.parkventory.notifications.OidcInvitationAccessMailer;
import io.quarkus.oidc.AuthorizationCodeFlow;
import io.quarkus.arc.profile.IfBuildProfile;
import io.quarkus.arc.profile.UnlessBuildProfile;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.core.HttpHeaders;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

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
    void adapterClassesDeclareMutuallyExclusiveBuildProfiles() throws NoSuchMethodException {
        assertEquals(
                "prod",
                LocalAuthResource.class.getAnnotation(UnlessBuildProfile.class).value());
        assertEquals(
                "prod",
                AuthService.class.getAnnotation(UnlessBuildProfile.class).value());
        assertEquals(
                "prod",
                LocalInvitationAccessMailer.class
                        .getAnnotation(UnlessBuildProfile.class)
                        .value());
        assertEquals(
                "prod",
                OidcAuthResource.class.getAnnotation(IfBuildProfile.class).value());
        assertEquals(
                "prod",
                OidcIdentityService.class.getAnnotation(IfBuildProfile.class).value());
        assertEquals(
                "prod",
                OidcInvitationAccessMailer.class.getAnnotation(IfBuildProfile.class).value());

        var logout = OidcAuthResource.class.getDeclaredMethod(
                "logout", String.class, HttpHeaders.class);
        assertNull(logout.getAnnotation(Authenticated.class));
        assertNotNull(logout.getAnnotation(PermitAll.class));
        var login = OidcAuthResource.class.getDeclaredMethod("login", HttpHeaders.class);
        assertNotNull(login.getAnnotation(Authenticated.class));
        assertNotNull(login.getAnnotation(AuthorizationCodeFlow.class));
    }
}
