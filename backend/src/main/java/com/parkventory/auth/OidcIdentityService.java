package com.parkventory.auth;

import com.parkventory.tenancy.TenantTransactionContext;
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
    private final TenantTransactionContext tenantContext;
    private final long sessionDays;

    public OidcIdentityService(
            AgroalDataSource dataSource,
            SecurityTokens tokens,
            TenantTransactionContext tenantContext,
            @ConfigProperty(name = "parkventory.auth.session-days") long sessionDays) {
        this.dataSource = dataSource;
        this.tokens = tokens;
        this.tenantContext = tenantContext;
        this.sessionDays = sessionDays;
    }

    @Transactional
    public AuthService.VerifiedSession signIn(OidcIdentityClaims identity) {
        String identityKey = identity.stableIdentityKey(tokens);
        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyVerifiedIdentity(
                    connection,
                    identity.normalizedEmail(),
                    ProfessionalEmail.domain(identity.normalizedEmail()));
            lock(connection, "identity:" + identityKey);
            lock(connection, "email:" + identity.normalizedEmail());
            UUID userId = findOrCreateBoundUser(connection, identity, identityKey);
            OrganizationResolution organization =
                    resolveOrganization(connection, identity.normalizedEmail());
            Membership membership =
                    findOrCreateMembership(
                            connection,
                            organization.organizationId(),
                            userId,
                            organization.explicitInvitation());
            String rawSession = tokens.issue();
            Instant expiresAt = Instant.now().plus(Duration.ofDays(sessionDays));

            try (PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_session (
                        user_account_id,
                        active_membership_id,
                        organization_id,
                        token_hash,
                        expires_at
                    ) VALUES (?, ?, ?, ?, ?)
                    """)) {
                statement.setObject(1, userId);
                statement.setObject(2, membership.membershipId());
                statement.setObject(3, organization.organizationId());
                statement.setString(4, tokens.hash(rawSession));
                statement.setObject(5, OffsetDateTime.ofInstant(expiresAt, ZoneOffset.UTC));
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
            if (isUniqueViolation(exception)) {
                throw identityConflict();
            }
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
                SELECT user_account_id
                  FROM user_email
                 WHERE normalized_email = ?
                   AND email_type = 'PROFESSIONAL'
                """)) {
            statement.setString(1, identity.normalizedEmail());
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    UUID userId = result.getObject("user_account_id", UUID.class);
                    tenantContext.applyIdentityUser(connection, userId);
                    bindExistingUser(connection, userId, identity.normalizedEmail(), identityKey);
                    return userId;
                }
            }
        }

        UUID userId = UUID.randomUUID();
        tenantContext.applyIdentityUser(connection, userId);
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

    private void bindExistingUser(
            Connection connection,
            UUID userId,
            String normalizedEmail,
            String identityKey) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT oidc_subject, status
                  FROM user_account
                 WHERE id = ?
                 FOR UPDATE
                """)) {
            statement.setObject(1, userId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw identityConflict();
                }
                requireActiveUser(result.getString("status"));
                String existingIdentity = result.getString("oidc_subject");
                if (existingIdentity != null && !existingIdentity.equals(identityKey)) {
                    throw identityConflict();
                }
            }
        }

        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE user_account
                   SET oidc_subject = ?,
                       status = CASE WHEN status = 'PENDING' THEN 'ACTIVE' ELSE status END,
                       updated_at = now()
                 WHERE id = ?
                   AND status IN ('PENDING', 'ACTIVE')
                   AND (oidc_subject IS NULL OR oidc_subject = ?)
                """)) {
            statement.setString(1, identityKey);
            statement.setObject(2, userId);
            statement.setString(3, identityKey);
            if (statement.executeUpdate() != 1) {
                throw identityConflict();
            }
        }
        markEmailVerified(connection, normalizedEmail);
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

    private OrganizationResolution resolveOrganization(
            Connection connection,
            String normalizedEmail) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT invitation.id, invitation.organization_id
                  FROM invitation
                 WHERE invitation.normalized_email = ?
                   AND invitation.status = 'PENDING'
                   AND invitation.expires_at > now()
                 ORDER BY invitation.created_at
                 LIMIT 1
                """)) {
            statement.setString(1, normalizedEmail);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    UUID invitationId = result.getObject("id", UUID.class);
                    UUID organizationId = result.getObject("organization_id", UUID.class);
                    tenantContext.applyTenant(connection, organizationId);
                    requireActiveOrganization(connection, organizationId);
                    try (PreparedStatement accept = connection.prepareStatement("""
                            UPDATE invitation
                               SET status = 'ACCEPTED', accepted_at = now()
                             WHERE organization_id = ?
                               AND id = ?
                               AND status = 'PENDING'
                               AND expires_at > now()
                            """)) {
                        accept.setObject(1, organizationId);
                        accept.setObject(2, invitationId);
                        if (accept.executeUpdate() != 1) {
                            throw identityConflict();
                        }
                    }
                    return new OrganizationResolution(organizationId, true);
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
                SELECT organization_id
                  FROM organization_domain
                 WHERE normalized_domain = ?
                   AND status IN ('CLAIMED', 'VERIFIED')
                 ORDER BY CASE status WHEN 'VERIFIED' THEN 0 ELSE 1 END
                 LIMIT 1
                """)) {
            statement.setString(1, domain);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    UUID organizationId = result.getObject("organization_id", UUID.class);
                    tenantContext.applyTenant(connection, organizationId);
                    requireActiveOrganization(connection, organizationId);
                    return new OrganizationResolution(organizationId, false);
                }
            }
        }

        UUID organizationId = UUID.randomUUID();
        tenantContext.applyTenant(connection, organizationId);
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
        return new OrganizationResolution(organizationId, false);
    }

    private void requireActiveOrganization(Connection connection, UUID organizationId)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT status
                  FROM organization
                 WHERE id = ?
                """)) {
            statement.setObject(1, organizationId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next() || !"ACTIVE".equals(result.getString("status"))) {
                    throw new ClientErrorException("Cette organisation n’est pas active.", 403);
                }
            }
        }
    }

    private Membership findOrCreateMembership(
            Connection connection,
            UUID organizationId,
            UUID userId,
            boolean explicitInvitation) throws SQLException {
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
                    if ("INVITED".equals(status) && explicitInvitation) {
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

    private static boolean isUniqueViolation(SQLException exception) {
        for (SQLException current = exception; current != null; current = current.getNextException()) {
            if ("23505".equals(current.getSQLState())) {
                return true;
            }
        }
        return false;
    }

    private record OrganizationResolution(UUID organizationId, boolean explicitInvitation) {
    }

    private record Membership(UUID membershipId, String role) {
    }
}
