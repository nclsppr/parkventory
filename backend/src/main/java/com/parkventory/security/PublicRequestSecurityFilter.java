package com.parkventory.security;

import com.parkventory.api.ApiExceptionMapper.ApiProblem;
import com.parkventory.auth.SessionService;
import io.quarkus.arc.profile.IfBuildProfile;
import jakarta.annotation.Priority;
import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Provider
@PreMatching
@Priority(Priorities.AUTHENTICATION - 100)
@IfBuildProfile("prod")
public class PublicRequestSecurityFilter implements ContainerRequestFilter {
    private static final Set<String> UNSAFE_METHODS = Set.of(
            HttpMethod.POST,
            HttpMethod.PUT,
            HttpMethod.PATCH,
            HttpMethod.DELETE);
    private static final Pattern OIDC_SESSION_COOKIE =
            Pattern.compile("q_session(?:_chunk_[0-9]+)?");

    private final RequestRateLimiter rateLimiter;
    private final String expectedOrigin;
    private final int loginLimit;
    private final Duration loginWindow;
    private final int invitationIpLimit;
    private final Duration invitationIpWindow;
    private final int mutationIpLimit;
    private final Duration mutationIpWindow;

    public PublicRequestSecurityFilter(
            RequestRateLimiter rateLimiter,
            @ConfigProperty(name = "parkventory.web.base-url") String webBaseUrl,
            @ConfigProperty(name = "parkventory.security.rate-limit.login.limit", defaultValue = "120")
                    int loginLimit,
            @ConfigProperty(name = "parkventory.security.rate-limit.login.window", defaultValue = "10M")
                    Duration loginWindow,
            @ConfigProperty(name = "parkventory.security.rate-limit.invitation-ip.limit", defaultValue = "30")
                    int invitationIpLimit,
            @ConfigProperty(name = "parkventory.security.rate-limit.invitation-ip.window", defaultValue = "10M")
                    Duration invitationIpWindow,
            @ConfigProperty(name = "parkventory.security.rate-limit.mutation-ip.limit", defaultValue = "300")
                    int mutationIpLimit,
            @ConfigProperty(name = "parkventory.security.rate-limit.mutation-ip.window", defaultValue = "1M")
                    Duration mutationIpWindow) {
        this.rateLimiter = rateLimiter;
        this.expectedOrigin = normalizeOrigin(webBaseUrl);
        this.loginLimit = loginLimit;
        this.loginWindow = loginWindow;
        this.invitationIpLimit = invitationIpLimit;
        this.invitationIpWindow = invitationIpWindow;
        this.mutationIpLimit = mutationIpLimit;
        this.mutationIpWindow = mutationIpWindow;
        requireValidRate("connexion", loginLimit, loginWindow);
        requireValidRate("invitation par adresse réseau", invitationIpLimit, invitationIpWindow);
        requireValidRate("mutation par adresse réseau", mutationIpLimit, mutationIpWindow);
    }

    @Override
    public void filter(ContainerRequestContext request) {
        String method = request.getMethod().toUpperCase(Locale.ROOT);
        String path = normalizePath(request.getUriInfo().getPath());
        if (!path.startsWith("/api/v1/")) {
            return;
        }

        if (!sameOrigin(request, method)) {
            request.abortWith(problem(
                    403,
                    "Cette requête ne provient pas de l’application Parkventory."));
            return;
        }

        RatePolicy policy = classify(method, path);
        if (policy == null) {
            return;
        }
        RequestRateLimiter.Decision decision = acquireBudget(
                policy,
                remoteAddress(request));
        if (!decision.allowed()) {
            request.abortWith(Response.status(429)
                    .type(MediaType.APPLICATION_JSON_TYPE)
                    .header(HttpHeaders.RETRY_AFTER, decision.retryAfterSeconds())
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .entity(new ApiProblem(
                            429,
                            "Trop de requêtes. Réessayez dans quelques instants."))
                    .build());
        }
    }

    RequestRateLimiter.Decision acquireBudget(
            RatePolicy policy,
            String remoteAddress) {
        String ipSubject = "ip:" + fingerprint(networkSubject(remoteAddress));
        return switch (policy) {
            case LOGIN -> rateLimiter.acquire(
                    "login-ip", ipSubject, loginLimit, loginWindow);
            case INVITATION -> rateLimiter.acquire(
                    "invitation-ip", ipSubject, invitationIpLimit, invitationIpWindow);
            case MUTATION -> rateLimiter.acquire(
                    "mutation-ip", ipSubject, mutationIpLimit, mutationIpWindow);
        };
    }

    static boolean sameOrigin(
            String method,
            String origin,
            String fetchSite,
            Set<String> cookieNames,
            String expectedOrigin) {
        if (!UNSAFE_METHODS.contains(method.toUpperCase(Locale.ROOT))) {
            return true;
        }
        if (fetchSite != null && "cross-site".equalsIgnoreCase(fetchSite.strip())) {
            return false;
        }
        if (origin != null) {
            try {
                return expectedOrigin.equals(normalizeOrigin(origin));
            } catch (IllegalArgumentException exception) {
                return false;
            }
        }
        return cookieNames.stream().noneMatch(PublicRequestSecurityFilter::isSessionCookie);
    }

    static RatePolicy classify(String method, String path) {
        String normalizedMethod = method.toUpperCase(Locale.ROOT);
        String normalizedPath = normalizePath(path);
        if (HttpMethod.GET.equals(normalizedMethod)
                && "/api/v1/auth/oidc/login".equals(normalizedPath)) {
            return RatePolicy.LOGIN;
        }
        if (HttpMethod.POST.equals(normalizedMethod)
                && ("/api/v1/auth/requests".equals(normalizedPath)
                || "/api/v1/auth/verify".equals(normalizedPath))) {
            return RatePolicy.LOGIN;
        }
        if (HttpMethod.POST.equals(normalizedMethod)
                && "/api/v1/invitations".equals(normalizedPath)) {
            return RatePolicy.INVITATION;
        }
        if (UNSAFE_METHODS.contains(normalizedMethod)) {
            return RatePolicy.MUTATION;
        }
        return null;
    }

    private boolean sameOrigin(ContainerRequestContext request, String method) {
        return sameOrigin(
                method,
                request.getHeaderString("Origin"),
                request.getHeaderString("Sec-Fetch-Site"),
                request.getCookies().keySet(),
                expectedOrigin);
    }

    private static String remoteAddress(ContainerRequestContext request) {
        String forwarded = request.getHeaderString("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) {
            return "direct";
        }
        String[] addresses = forwarded.split(",");
        String address = addresses[addresses.length - 1].strip();
        return address.isEmpty() || address.length() > 128 ? "invalid" : address;
    }

    static String networkSubject(String rawAddress) {
        String address = rawAddress == null ? "invalid" : rawAddress.strip();
        if (!address.contains(":")) {
            return address;
        }
        int zoneSeparator = address.indexOf('%');
        String literal = zoneSeparator < 0 ? address : address.substring(0, zoneSeparator);
        try {
            InetAddress parsed = InetAddress.getByName(literal);
            if (parsed instanceof Inet6Address) {
                return "ipv6-64:" + HexFormat.of().formatHex(parsed.getAddress(), 0, 8);
            }
        } catch (UnknownHostException ignored) {
            return "invalid";
        }
        return address;
    }

    private static String fingerprint(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 16);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponible.", exception);
        }
    }

    private static boolean isSessionCookie(String name) {
        return SessionService.COOKIE_NAME.equals(name)
                || OIDC_SESSION_COOKIE.matcher(name).matches();
    }

    private static String normalizeOrigin(String rawOrigin) {
        URI uri = URI.create(rawOrigin.strip());
        String scheme = uri.getScheme() == null
                ? ""
                : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!("http".equals(scheme) || "https".equals(scheme))
                || uri.getHost() == null
                || uri.getUserInfo() != null
                || (uri.getPath() != null
                && !uri.getPath().isEmpty()
                && !"/".equals(uri.getPath()))
                || uri.getQuery() != null
                || uri.getFragment() != null) {
            throw new IllegalArgumentException("Origine HTTP invalide.");
        }
        int port = uri.getPort();
        boolean defaultPort = port < 0
                || ("http".equals(scheme) && port == 80)
                || ("https".equals(scheme) && port == 443);
        return scheme
                + "://"
                + uri.getHost().toLowerCase(Locale.ROOT)
                + (defaultPort ? "" : ":" + port);
    }

    private static String normalizePath(String path) {
        String normalized = "/" + path.replaceFirst("^/+", "");
        normalized = normalized
                .replaceAll(";[^/]*", "")
                .replaceAll("/{2,}", "/");
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            return normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static void requireValidRate(String name, int limit, Duration window) {
        if (limit < 1 || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException(
                    "La limite de " + name + " et sa fenêtre doivent être positives.");
        }
    }

    private static Response problem(int status, String detail) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .entity(new ApiProblem(status, detail))
                .build();
    }

    enum RatePolicy {
        LOGIN,
        INVITATION,
        MUTATION
    }
}
