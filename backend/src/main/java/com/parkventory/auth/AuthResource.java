package com.parkventory.auth;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import static com.parkventory.auth.AuthModels.*;

@Path("/api/v1/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Identité locale")
public class AuthResource {
    private final SessionService sessionService;

    public AuthResource(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GET
    @Path("/session")
    public Response session(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken) {
        SessionContext context = sessionService.require(rawSessionToken);
        return Response.ok(new SessionView(
                        true,
                        context.displayName(),
                        context.normalizedEmail(),
                        context.organizationName(),
                        context.role()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    static String sessionCookie(String value, long maxAgeSeconds, boolean secure) {
        return SessionService.COOKIE_NAME
                + "="
                + value
                + "; Path=/; HttpOnly; SameSite=Lax; Max-Age="
                + maxAgeSeconds
                + (secure ? "; Secure" : "");
    }
}
