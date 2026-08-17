package com.parkventory.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthResourceCookieTest {
    @Test
    void productionCookieIsSecureAndBoundedToTheOrigin() {
        assertEquals(
                "parkventory_session=token; Path=/; HttpOnly; SameSite=Lax; Max-Age=42; Secure",
                AuthResource.sessionCookie("token", 42, true));
    }

    @Test
    void localCookieDoesNotPretendToUseHttps() {
        assertEquals(
                "parkventory_session=token; Path=/; HttpOnly; SameSite=Lax; Max-Age=42",
                AuthResource.sessionCookie("token", 42, false));
    }
}
