package com.parkventory.auth;

import io.quarkus.oidc.AuthorizationCodeFlow;
import io.quarkus.oidc.IdToken;
import io.quarkus.oidc.OidcSession;
import io.quarkus.arc.profile.IfBuildProfile;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.net.URI;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;

import static com.parkventory.auth.AuthModels.*;

@Path("/api/v1/auth/oidc")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Identité OIDC")
@IfBuildProfile("prod")
public class OidcAuthResource {
    private static final Logger LOG = Logger.getLogger(OidcAuthResource.class);
    private static final Pattern OIDC_SESSION_COOKIE =
            Pattern.compile("q_session(?:_chunk_[0-9]+)?");

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
    @AuthorizationCodeFlow
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
    @PermitAll
    public Response logout(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken,
            @Context HttpHeaders requestHeaders) {
        sessionService.revoke(rawSessionToken);
        // Quarkus clears its local OIDC token-state cookie. Auth0's browser
        // cookie can remain; every new authorization request forces prompt=login.
        try {
            oidcSession.logout().await().indefinitely();
        } catch (RuntimeException exception) {
            // app_session is already revoked in its own transaction. The
            // response also asks the browser to clear every same-origin cookie.
            LOG.warn(
                    "La session Parkventory est révoquée, mais le cookie OIDC local n’a pas pu être nettoyé.",
                    exception);
        }
        Response.ResponseBuilder response = Response.ok(new AuthAction(
                        true,
                        "La session Parkventory est fermée. Votre e-mail sera revérifié à la prochaine connexion."))
                .header(HttpHeaders.SET_COOKIE, AuthResource.sessionCookie("", 0, secureCookie))
                .header("Clear-Site-Data", "\"cookies\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store");

        Set<String> oidcCookieNames = new TreeSet<>();
        oidcCookieNames.add("q_session");
        requestHeaders.getCookies().keySet().stream()
                .filter(name -> OIDC_SESSION_COOKIE.matcher(name).matches())
                .forEach(oidcCookieNames::add);
        oidcCookieNames.forEach(name -> response.header(
                HttpHeaders.SET_COOKIE,
                expiredOidcCookie(name)));
        return response.build();
    }

    private String expiredOidcCookie(String name) {
        return name
                + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
                + (secureCookie ? "; Secure" : "");
    }
}
