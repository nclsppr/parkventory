package com.parkventory.auth;

import jakarta.ws.rs.ClientErrorException;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Objects;

record OidcIdentityClaims(String issuer, String subject, String normalizedEmail) {
    private static final int MAX_SUBJECT_LENGTH = 512;

    static OidcIdentityClaims from(JsonWebToken token, String expectedIssuer) {
        Objects.requireNonNull(token, "token");
        return validate(
                token.getIssuer(),
                token.getSubject(),
                token.getClaim("email"),
                token.getClaim("email_verified"),
                expectedIssuer);
    }

    static OidcIdentityClaims validate(
            String issuer,
            String subject,
            Object email,
            Object emailVerified,
            String expectedIssuer) {
        if (expectedIssuer == null
                || expectedIssuer.isBlank()
                || !expectedIssuer.equals(issuer)) {
            throw rejected();
        }
        if (subject == null
                || subject.isBlank()
                || subject.length() > MAX_SUBJECT_LENGTH
                || subject.codePoints().anyMatch(Character::isISOControl)) {
            throw rejected();
        }
        if (!(email instanceof String emailClaim) || !Boolean.TRUE.equals(emailVerified)) {
            throw rejected();
        }
        return new OidcIdentityClaims(
                issuer,
                subject,
                ProfessionalEmail.normalize(emailClaim));
    }

    String stableIdentityKey(SecurityTokens tokens) {
        return "oidc-v1:" + tokens.hash(issuer + "\u0000" + subject);
    }

    private static ClientErrorException rejected() {
        return new ClientErrorException(
                "Le fournisseur n’a pas fourni une identité professionnelle vérifiée.",
                401);
    }
}
