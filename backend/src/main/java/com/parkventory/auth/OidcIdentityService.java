package com.parkventory.auth;

import io.agroal.api.AgroalDataSource;
import io.quarkus.arc.profile.IfBuildProfile;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ClientErrorException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.UUID;

@ApplicationScoped
@IfBuildProfile("prod")
public class OidcIdentityService {
    private final AgroalDataSource dataSource;
    private final SecurityTokens tokens;
    private final long sessionDays;

    public OidcIdentityService(
            AgroalDataSource dataSource,
            SecurityTokens tokens,
            @ConfigProperty(name = "parkventory.auth.session-days") long sessionDays) {
        this.dataSource = dataSource;
        this.tokens = tokens;
        this.sessionDays = sessionDays;
    }

    @Transactional
    public AuthService.VerifiedSession signIn(OidcIdentityClaims identity) {
        String identityKey = identity.stableIdentityKey(tokens);
        try (Connection connection = dataSource.getConnection()) {
            lock(connection, "identity:" + identityKey);
            lock(connection, "email:" + identity.normalizedEmail());
            UUID userId = findOrCreateBoundUser(connection, identity, identityKey);
            OrganizationResolution organization =
                    resolveOrganization(connection, identity.normalizedEmail());
            Membership membership =
                    findOrCreateMembership(connection, organization.organizationId(), userId);
            String rawSession = tokens.issue();
            Instant expiresAt = Instant.now().plus(Duration.ofDays(sessionDays));

            try (PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_session (
                        user_account_id,
                        active_membership_id,
                        token_hash,
                        expires_at
                    ) VALUES (?, ?, ?, ?)
                    """)) {
                statement.setObject(1, userId);
                statement.setObject(2, membership.membershipId());
                statement.setString(3, tokens.hash(rawSession));
                statement.setObject(4, OffsetDateTime.ofInstant(expiresAt, ZoneOffset.UTC));
                statement.executeUpdate();
            }

            insertAudit(
                    connection,
                    organization.organizationId(),
                    membership.membershipId(),
                    "AUTH_OIDC_SIGN_IN",
                    userId);
            SessionContext context = loadContext(
                    connection,
                    userId,
                    membership.membershipId(),
                    organization.organizationId());
            return new AuthService.VerifiedSession(rawSession, expiresAt, context);
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible d’établir la session OIDC.", exception);
        }
    }

    public long sessionMaxAgeSeconds() {
        return Duration.ofDays(sessionDays).toSeconds();
    }

    private UUID findOrCreateBoundUser(
            Connection connection,
            OidcIdentityClaims identity,
            String identityKey) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT ua.id,
                       ua.status,
                       ue.normalized_email
                  FROM user_account ua
                  LEFT JOIN user_email ue
                    ON ue.user_account_id = ua.id
                   AND ue.email_type = 'PROFESSIONAL'
                 WHERE ua.oidc_subject = ?
                 FOR UPDATE OF ua
                """)) {
            statement.setString(1, identityKey);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    requireActiveUser(result.getString("status"));
                    String boundEmail = result.getString("normalized_email");
                    if (boundEmail == null || !boundEmail.equals(identity.normalizedEmail())) {
                        throw identityConflict();
                    }
                    activateUser(connection, result.getObject("id", UUID.class));
                    markEmailVerified(connection, identity.normalizedEmail());
                    return result.getObject("id", UUID.class);
                }
            }
        }

        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT ua.id,
                       ua.oidc_subject,
                       ua.status
                  FROM user_email ue
                  JOIN user_account ua ON ua.id = ue.user_account_id
                 WHERE ue.normalized_email = ?
                   AND ue.email_type = 'PROFESSIONAL'
                 FOR UPDATE OF ua, ue
                """)) {
            statement.setString(1, identity.normalizedEmail());
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    UUID userId = result.getObject("id", UUID.class);
                    String existingIdentity = result.getString("oidc_subject");
                    requireActiveUser(result.getString("status"));
                    if (existingIdentity != null && !existingIdentity.equals(identityKey)) {
                        throw identityConflict();
                    }
                    try (PreparedStatement bind = connection.prepareStatement("""
                            UPDATE user_account
                               SET oidc_subject = ?, status = 'ACTIVE', updated_at = now()
                             WHERE id = ?
                               AND (oidc_subject IS NULL OR oidc_subject = ?)
                            """)) {
                        bind.setString(1, identityKey);
                        bind.setObject(2, userId);
                        bind.setString(3, identityKey);
                        if (bind.executeUpdate() != 1) {
                            throw identityConflict();
                        }
                    }
                    markEmailVerified(connection, identity.normalizedEmail());
                    return userId;
                }
            }
        }

        UUID userId = UUID.randomUUID();
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO user_account (id, oidc_subject, display_name, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """)) {
            statement.setObject(1, userId);
            statement.setString(2, identityKey);
            statement.setString(3, displayName(identity.normalizedEmail()));
            statement.executeUpdate();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO user_email (
                    user_account_id,
                    normalized_email,
                    email_type,
                    verified_at
                ) VALUES (?, ?, 'PROFESSIONAL', now())
                """)) {
            statement.setObject(1, userId);
            statement.setString(2, identity.normalizedEmail());
            statement.executeUpdate();
        }
        return userId;
    }

    private void markEmailVerified(Connection connection, String normalizedEmail)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE user_email
                   SET verified_at = COALESCE(verified_at, now())
                 WHERE normalized_email = ?
                   AND email_type = 'PROFESSIONAL'
                """)) {
            statement.setString(1, normalizedEmail);
            statement.executeUpdate();
        }
    }

    private void activateUser(Connection connection, UUID userId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE user_account
                   SET status = 'ACTIVE', updated_at = now()
                 WHERE id = ?
                   AND status IN ('PENDING', 'ACTIVE')
                """)) {
            statement.setObject(1, userId);
            if (statement.executeUpdate() != 1) {
                throw identityConflict();
            }
        }
    }

    private OrganizationResolution resolveOrganization(
            Connection connection,
            String normalizedEmail) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT invitation.id, invitation.organization_id
                  FROM invitation
                  JOIN organization ON organization.id = invitation.organization_id
                 WHERE invitation.normalized_email = ?
                   AND invitation.status = 'PENDING'
                   AND invitation.expires_at > now()
                   AND organization.status = 'ACTIVE'
                 ORDER BY invitation.created_at
                 LIMIT 1
                 FOR UPDATE OF invitation
                """)) {
            statement.setString(1, normalizedEmail);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    UUID invitationId = result.getObject("id", UUID.class);
                    UUID organizationId = result.getObject("organization_id", UUID.class);
                    try (PreparedStatement accept = connection.prepareStatement("""
                            UPDATE invitation
                               SET status = 'ACCEPTED', accepted_at = now()
                             WHERE id = ?
                               AND status = 'PENDING'
                            """)) {
                        accept.setObject(1, invitationId);
                        if (accept.executeUpdate() != 1) {
                            throw identityConflict();
                        }
                    }
                    return new OrganizationResolution(organizationId);
                }
            }
        }

        String domain = ProfessionalEmail.domain(normalizedEmail);
        try (PreparedStatement lock = connection.prepareStatement(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))")) {
            lock.setString(1, domain);
            lock.executeQuery().close();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT organization_domain.organization_id
                  FROM organization_domain
                  JOIN organization
                    ON organization.id = organization_domain.organization_id
                   AND organization.status = 'ACTIVE'
                 WHERE organization_domain.normalized_domain = ?
                   AND organization_domain.status IN ('CLAIMED', 'VERIFIED')
                 ORDER BY CASE organization_domain.status WHEN 'VERIFIED' THEN 0 ELSE 1 END
                 LIMIT 1
                """)) {
            statement.setString(1, domain);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    return new OrganizationResolution(
                            result.getObject("organization_id", UUID.class));
                }
            }
        }

        UUID organizationId = UUID.randomUUID();
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO organization (id, name, mode)
                VALUES (?, ?, 'COMMUNITY')
                """)) {
            statement.setObject(1, organizationId);
            statement.setString(2, organizationName(domain));
            statement.executeUpdate();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO organization_domain (
                    organization_id,
                    normalized_domain,
                    status,
                    proof_method
                ) VALUES (?, ?, 'CLAIMED', 'VERIFIED_EMAIL')
                """)) {
            statement.setObject(1, organizationId);
            statement.setString(2, domain);
            statement.executeUpdate();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO parking_site (organization_id, name, timezone)
                VALUES (?, 'Parking principal', 'Europe/Paris')
                """)) {
            statement.setObject(1, organizationId);
            statement.executeUpdate();
        }
        return new OrganizationResolution(organizationId);
    }

    private Membership findOrCreateMembership(
            Connection connection,
            UUID organizationId,
            UUID userId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT id, role, status
                  FROM membership
                 WHERE organization_id = ?
                   AND user_account_id = ?
                 FOR UPDATE
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, userId);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    String status = result.getString("status");
                    if ("INVITED".equals(status)) {
                        try (PreparedStatement activate = connection.prepareStatement("""
                                UPDATE membership
                                   SET status = 'ACTIVE'
                                 WHERE id = ?
                                   AND status = 'INVITED'
                                """)) {
                            activate.setObject(1, result.getObject("id", UUID.class));
                            if (activate.executeUpdate() != 1) {
                                throw identityConflict();
                            }
                        }
                    } else if (!"ACTIVE".equals(status)) {
                        throw new ClientErrorException("Cette adhésion n’est pas active.", 403);
                    }
                    return new Membership(
                            result.getObject("id", UUID.class),
                            result.getString("role"));
                }
            }
        }

        UUID membershipId = UUID.randomUUID();
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO membership (
                    id,
                    organization_id,
                    user_account_id,
                    role,
                    status
                ) VALUES (?, ?, ?, 'MEMBER', 'ACTIVE')
                """)) {
            statement.setObject(1, membershipId);
            statement.setObject(2, organizationId);
            statement.setObject(3, userId);
            statement.executeUpdate();
        }
        return new Membership(membershipId, "MEMBER");
    }

    private void lock(Connection connection, String key) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))")) {
            statement.setString(1, key);
            statement.executeQuery().close();
        }
    }

    private SessionContext loadContext(
            Connection connection,
            UUID userId,
            UUID membershipId,
            UUID organizationId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT ua.display_name,
                       ue.normalized_email,
                       organization.name AS organization_name,
                       membership.role
                  FROM user_account ua
                  JOIN user_email ue
                    ON ue.user_account_id = ua.id
                   AND ue.email_type = 'PROFESSIONAL'
                  JOIN membership ON membership.id = ?
                  JOIN organization ON organization.id = ?
                 WHERE ua.id = ?
                 LIMIT 1
                """)) {
            statement.setObject(1, membershipId);
            statement.setObject(2, organizationId);
            statement.setObject(3, userId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw identityConflict();
                }
                return new SessionContext(
                        userId,
                        membershipId,
                        organizationId,
                        result.getString("display_name"),
                        result.getString("normalized_email"),
                        result.getString("organization_name"),
                        result.getString("role"));
            }
        }
    }

    private void insertAudit(
            Connection connection,
            UUID organizationId,
            UUID membershipId,
            String action,
            UUID userId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO audit_event (
                    organization_id,
                    actor_membership_id,
                    action,
                    target_type,
                    target_id,
                    result
                ) VALUES (?, ?, ?, 'USER_ACCOUNT', ?, 'SUCCESS')
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, membershipId);
            statement.setString(3, action);
            statement.setObject(4, userId);
            statement.executeUpdate();
        }
    }

    private static void requireActiveUser(String status) {
        if (!"ACTIVE".equals(status) && !"PENDING".equals(status)) {
            throw new ClientErrorException("Ce compte n’est pas actif.", 403);
        }
    }

    private static String displayName(String normalizedEmail) {
        String localPart = normalizedEmail.substring(0, normalizedEmail.indexOf('@'))
                .replaceAll("[._+-]+", " ")
                .trim();
        if (localPart.isBlank()) {
            return "Membre Parkventory";
        }
        String[] words = localPart.split("\\s+");
        StringBuilder name = new StringBuilder();
        for (String word : words) {
            if (!name.isEmpty()) {
                name.append(' ');
            }
            name.append(word.substring(0, 1).toUpperCase(Locale.FRENCH))
                    .append(word.substring(1));
        }
        return name.length() > 100 ? name.substring(0, 100) : name.toString();
    }

    private static String organizationName(String domain) {
        String label = domain.split("\\.")[0].replace('-', ' ').trim();
        if (label.isBlank()) {
            return "Espace " + domain;
        }
        return label.substring(0, 1).toUpperCase(Locale.FRENCH)
                + label.substring(1)
                + " — communauté";
    }

    private static ClientErrorException identityConflict() {
        return new ClientErrorException(
                "Cette identité ne peut pas être liée automatiquement.",
                409);
    }

    private record OrganizationResolution(UUID organizationId) {
    }

    private record Membership(UUID membershipId, String role) {
    }
}
