package com.parkventory.auth;

import io.quarkus.oidc.IdToken;
import io.quarkus.oidc.OidcSession;
import io.quarkus.arc.profile.IfBuildProfile;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.net.URI;

import static com.parkventory.auth.AuthModels.*;

@Path("/api/v1/auth/oidc")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Identité OIDC")
@IfBuildProfile("prod")
public class OidcAuthResource {
    private final OidcIdentityService identityService;
    private final SessionService sessionService;
    private final OidcSession oidcSession;
    private final String expectedIssuer;
    private final String webBaseUrl;
    private final boolean secureCookie;

    @Inject
    @IdToken
    JsonWebToken idToken;

    public OidcAuthResource(
            OidcIdentityService identityService,
            SessionService sessionService,
            OidcSession oidcSession,
            @ConfigProperty(name = "parkventory.oidc.expected-issuer", defaultValue = "disabled")
                    String expectedIssuer,
            @ConfigProperty(name = "parkventory.web.base-url") String webBaseUrl,
            @ConfigProperty(name = "parkventory.cookie.secure", defaultValue = "false")
                    boolean secureCookie) {
        this.identityService = identityService;
        this.sessionService = sessionService;
        this.oidcSession = oidcSession;
        this.expectedIssuer = expectedIssuer;
        this.webBaseUrl = webBaseUrl.replaceAll("/+$", "");
        this.secureCookie = secureCookie;
    }

    @GET
    @Path("/login")
    @Authenticated
    public Response login() {
        OidcIdentityClaims claims = OidcIdentityClaims.from(idToken, expectedIssuer);
        AuthService.VerifiedSession verified = identityService.signIn(claims);
        return Response.seeOther(URI.create(webBaseUrl + "/app"))
                .header(
                        HttpHeaders.SET_COOKIE,
                        AuthResource.sessionCookie(
                                verified.rawSessionToken(),
                                identityService.sessionMaxAgeSeconds(),
                                secureCookie))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    @POST
    @Path("/logout")
    @Authenticated
    public Response logout(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken) {
        sessionService.revoke(rawSessionToken);
        // Quarkus clears its local OIDC token-state cookie. Auth0's browser
        // cookie can remain; every new authorization request forces prompt=login.
        oidcSession.logout().await().indefinitely();
        return Response.ok(new AuthAction(
                        true,
                        "La session Parkventory est fermée. Votre e-mail sera revérifié à la prochaine connexion."))
                .header(HttpHeaders.SET_COOKIE, AuthResource.sessionCookie("", 0, secureCookie))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }
}
