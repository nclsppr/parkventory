package com.parkventory.auth;

import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import static com.parkventory.auth.AuthModels.*;

@Path("/api/v1/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Identité locale")
public class AuthResource {
    private final AuthService authService;
    private final SessionService sessionService;
    private final boolean secureCookie;

    public AuthResource(
            AuthService authService,
            SessionService sessionService,
            @ConfigProperty(name = "parkventory.cookie.secure", defaultValue = "false")
                    boolean secureCookie) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.secureCookie = secureCookie;
    }

    @POST
    @Path("/requests")
    public Response requestMagicLink(@Valid MagicLinkRequest request) {
        return Response.accepted(authService.requestMagicLink(request)).build();
    }

    @POST
    @Path("/verify")
    public Response verify(@Valid MagicLinkVerification verification) {
        AuthService.VerifiedSession verified = authService.verify(verification);
        SessionContext context = verified.context();
        SessionView view = new SessionView(
                true,
                context.displayName(),
                context.normalizedEmail(),
                context.organizationName(),
                context.role());
        String cookie = sessionCookie(
                verified.rawSessionToken(), authService.sessionMaxAgeSeconds(), secureCookie);
        return Response.ok(view)
                .header(HttpHeaders.SET_COOKIE, cookie)
                .build();
    }

    @GET
    @Path("/session")
    public SessionView session(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken) {
        SessionContext context = sessionService.require(rawSessionToken);
        return new SessionView(
                true,
                context.displayName(),
                context.normalizedEmail(),
                context.organizationName(),
                context.role());
    }

    @DELETE
    @Path("/session")
    public Response logout(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken) {
        sessionService.revoke(rawSessionToken);
        return Response.ok(new AuthAction(true, "Vous êtes déconnecté."))
                .header(
                        HttpHeaders.SET_COOKIE,
                        sessionCookie("", 0, secureCookie))
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
