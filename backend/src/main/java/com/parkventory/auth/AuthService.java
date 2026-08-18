package com.parkventory.auth;

import com.parkventory.tenancy.TenantTransactionContext;
import io.quarkus.arc.profile.UnlessBuildProfile;
import io.agroal.api.AgroalDataSource;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

import static com.parkventory.auth.AuthModels.*;

@ApplicationScoped
@UnlessBuildProfile("prod")
public class AuthService {
    private final AgroalDataSource dataSource;
    private final SecurityTokens tokens;
    private final Mailer mailer;
    private final TenantTransactionContext tenantContext;
    private final String webBaseUrl;
    private final long magicLinkMinutes;
    private final long sessionDays;

    public AuthService(
            AgroalDataSource dataSource,
            SecurityTokens tokens,
            Mailer mailer,
            TenantTransactionContext tenantContext,
            @ConfigProperty(name = "parkventory.web.base-url") String webBaseUrl,
            @ConfigProperty(name = "parkventory.auth.magic-link-minutes") long magicLinkMinutes,
            @ConfigProperty(name = "parkventory.auth.session-days") long sessionDays) {
        this.dataSource = dataSource;
        this.tokens = tokens;
        this.mailer = mailer;
        this.tenantContext = tenantContext;
        this.webBaseUrl = webBaseUrl.replaceAll("/+$", "");
        this.magicLinkMinutes = magicLinkMinutes;
        this.sessionDays = sessionDays;
    }

    @Transactional
    public AuthAction requestMagicLink(MagicLinkRequest request) {
        String normalizedEmail = ProfessionalEmail.normalize(request.email());
        String rawToken = tokens.issue();
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(magicLinkMinutes));

        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyRequestedEmail(connection, normalizedEmail);
            try (PreparedStatement invalidate = connection.prepareStatement("""
                    UPDATE magic_link_request
                       SET consumed_at = now()
                     WHERE normalized_email = ?
                       AND consumed_at IS NULL
                    """)) {
                invalidate.setString(1, normalizedEmail);
                invalidate.executeUpdate();
            }
            insertMagicLink(connection, normalizedEmail, rawToken, "SIGN_IN", expiresAt);
            sendMagicLink(normalizedEmail, rawToken, false);
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de préparer le lien de connexion.", exception);
        }

        return new AuthAction(
                true,
                "Un lien de connexion a été envoyé. En local, ouvrez-le depuis Mailpit.");
    }

    @Transactional
    public VerifiedSession verify(MagicLinkVerification verification) {
        String rawToken = verification.token() == null ? "" : verification.token().trim();
        if (rawToken.length() < 32 || rawToken.length() > 128) {
            throw invalidLink();
        }

        try (Connection connection = dataSource.getConnection()) {
            String tokenHash = tokens.hash(rawToken);
            tenantContext.applyMagicLink(connection, tokenHash);
            MagicLink magicLink = consumeMagicLink(connection, tokenHash);
            tenantContext.applyVerifiedIdentity(
                    connection,
                    magicLink.normalizedEmail(),
                    ProfessionalEmail.domain(magicLink.normalizedEmail()));
            UUID userId = findOrCreateUser(connection, magicLink.normalizedEmail());
            OrganizationResolution organization =
                    resolveOrganization(connection, magicLink.normalizedEmail());
            Membership membership =
                    findOrCreateMembership(connection, organization.organizationId(), userId);
            String rawSession = tokens.issue();
            Instant sessionExpiresAt = Instant.now().plus(Duration.ofDays(sessionDays));

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
                statement.setObject(5, OffsetDateTime.ofInstant(sessionExpiresAt, ZoneOffset.UTC));
                statement.executeUpdate();
            }

            insertAudit(
                    connection,
                    organization.organizationId(),
                    membership.membershipId(),
                    "AUTH_SIGN_IN",
                    "USER_ACCOUNT",
                    userId);

            SessionContext context = loadContext(
                    connection,
                    userId,
                    membership.membershipId(),
                    organization.organizationId());
            return new VerifiedSession(rawSession, sessionExpiresAt, context);
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de valider le lien de connexion.", exception);
        }
    }

    public void sendInvitationMagicLink(Connection connection, String normalizedEmail)
            throws SQLException {
        tenantContext.applyRequestedEmail(connection, normalizedEmail);
        String rawToken = tokens.issue();
        insertMagicLink(
                connection,
                normalizedEmail,
                rawToken,
                "INVITATION",
                Instant.now().plus(Duration.ofMinutes(magicLinkMinutes)));
        sendMagicLink(normalizedEmail, rawToken, true);
    }

    public long sessionMaxAgeSeconds() {
        return Duration.ofDays(sessionDays).toSeconds();
    }

    private void sendMagicLink(String normalizedEmail, String rawToken, boolean invitation) {
        String link = webBaseUrl
                + "/auth/callback?token="
                + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        String subject = invitation
                ? "Votre invitation Parkventory"
                : "Votre lien de connexion Parkventory";
        String introduction = invitation
                ? "Un collègue vous invite à rejoindre son espace Parkventory."
                : "Vous avez demandé à vous connecter à Parkventory.";
        String body = """
                %s

                Ouvrez ce lien à usage unique, valable %d minutes :
                %s

                Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
                """.formatted(introduction, magicLinkMinutes, link);
        mailer.send(Mail.withText(normalizedEmail, subject, body));
    }

    private void insertMagicLink(
            Connection connection,
            String normalizedEmail,
            String rawToken,
            String purpose,
            Instant expiresAt) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO magic_link_request (
                    normalized_email,
                    token_hash,
                    purpose,
                    expires_at
                ) VALUES (?, ?, ?, ?)
                """)) {
            statement.setString(1, normalizedEmail);
            statement.setString(2, tokens.hash(rawToken));
            statement.setString(3, purpose);
            statement.setObject(4, OffsetDateTime.ofInstant(expiresAt, ZoneOffset.UTC));
            statement.executeUpdate();
        }
    }

    private MagicLink consumeMagicLink(Connection connection, String tokenHash) throws SQLException {
        UUID requestId;
        String normalizedEmail;
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT id, normalized_email
                  FROM magic_link_request
                 WHERE token_hash = ?
                   AND consumed_at IS NULL
                   AND expires_at > now()
                 FOR UPDATE
                """)) {
            statement.setString(1, tokenHash);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw invalidLink();
                }
                requestId = result.getObject("id", UUID.class);
                normalizedEmail = result.getString("normalized_email");
            }
        }

        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE magic_link_request
                   SET consumed_at = now()
                 WHERE id = ?
                   AND consumed_at IS NULL
                """)) {
            statement.setObject(1, requestId);
            if (statement.executeUpdate() != 1) {
                throw invalidLink();
            }
        }
        return new MagicLink(normalizedEmail);
    }

    private UUID findOrCreateUser(Connection connection, String normalizedEmail)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT user_account_id
                  FROM user_email
                 WHERE normalized_email = ?
                """)) {
            statement.setString(1, normalizedEmail);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next()) {
                    UUID userId = result.getObject("user_account_id", UUID.class);
                    tenantContext.applyIdentityUser(connection, userId);
                    try (PreparedStatement update = connection.prepareStatement("""
                            UPDATE user_email
                               SET verified_at = COALESCE(verified_at, now())
                             WHERE normalized_email = ?
                            """)) {
                        update.setString(1, normalizedEmail);
                        update.executeUpdate();
                    }
                    try (PreparedStatement update = connection.prepareStatement("""
                            UPDATE user_account
                               SET status = 'ACTIVE', updated_at = now()
                             WHERE id = ?
                            """)) {
                        update.setObject(1, userId);
                        update.executeUpdate();
                    }
                    return userId;
                }
            }
        }

        UUID userId = UUID.randomUUID();
        tenantContext.applyIdentityUser(connection, userId);
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO user_account (id, display_name, status)
                VALUES (?, ?, 'ACTIVE')
                """)) {
            statement.setObject(1, userId);
            statement.setString(2, displayName(normalizedEmail));
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
            statement.setString(2, normalizedEmail);
            statement.executeUpdate();
        }
        return userId;
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
                            throw invalidLink();
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
                    return new OrganizationResolution(organizationId);
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
        return new OrganizationResolution(organizationId);
    }

    private Membership findOrCreateMembership(
            Connection connection,
            UUID organizationId,
            UUID userId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO membership (
                    organization_id,
                    user_account_id,
                    role,
                    status
                ) VALUES (?, ?, 'MEMBER', 'ACTIVE')
                ON CONFLICT (organization_id, user_account_id)
                DO UPDATE SET status = 'ACTIVE'
                RETURNING id, role
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, userId);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return new Membership(
                        result.getObject("id", UUID.class),
                        result.getString("role"));
            }
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
                       o.name AS organization_name,
                       m.role
                  FROM user_account ua
                  JOIN user_email ue ON ue.user_account_id = ua.id
                                    AND ue.email_type = 'PROFESSIONAL'
                  JOIN membership m ON m.id = ?
                  JOIN organization o ON o.id = ?
                 WHERE ua.id = ?
                 ORDER BY ue.created_at
                 LIMIT 1
                """)) {
            statement.setObject(1, membershipId);
            statement.setObject(2, organizationId);
            statement.setObject(3, userId);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
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
            String targetType,
            UUID targetId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO audit_event (
                    organization_id,
                    actor_membership_id,
                    action,
                    target_type,
                    target_id,
                    result
                ) VALUES (?, ?, ?, ?, ?, 'SUCCESS')
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, membershipId);
            statement.setString(3, action);
            statement.setString(4, targetType);
            statement.setObject(5, targetId);
            statement.executeUpdate();
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

    private static ClientErrorException invalidLink() {
        return new ClientErrorException("Ce lien est invalide, expiré ou déjà utilisé.", 410);
    }

    private record MagicLink(String normalizedEmail) {
    }

    private record OrganizationResolution(UUID organizationId) {
    }

    private record Membership(UUID membershipId, String role) {
    }

    public record VerifiedSession(
            String rawSessionToken,
            Instant expiresAt,
            SessionContext context) {
    }
}
