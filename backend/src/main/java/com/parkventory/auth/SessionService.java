package com.parkventory.auth;

import com.parkventory.tenancy.TenantTransactionContext;
import io.agroal.api.AgroalDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ClientErrorException;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class SessionService {
    public static final String COOKIE_NAME = "parkventory_session";

    private final AgroalDataSource dataSource;
    private final SecurityTokens tokens;
    private final TenantTransactionContext tenantContext;

    public SessionService(
            AgroalDataSource dataSource,
            SecurityTokens tokens,
            TenantTransactionContext tenantContext) {
        this.dataSource = dataSource;
        this.tokens = tokens;
        this.tenantContext = tenantContext;
    }

    @Transactional
    public SessionContext require(String rawSessionToken) {
        return find(rawSessionToken)
                .orElseThrow(() -> new ClientErrorException("Authentification requise.", 401));
    }

    @Transactional
    public Optional<SessionContext> find(String rawSessionToken) {
        if (rawSessionToken == null || rawSessionToken.isBlank()) {
            return Optional.empty();
        }

        try (Connection connection = dataSource.getConnection()) {
            String tokenHash = tokens.hash(rawSessionToken);
            tenantContext.applySession(connection, tokenHash);
            SessionIdentity identity = loadSessionIdentity(connection, tokenHash);
            if (identity == null) {
                return Optional.empty();
            }
            tenantContext.applyIdentityUser(connection, identity.userId());
            tenantContext.applyTenant(connection, identity.organizationId());
            return loadTenantSessionContext(connection, identity);
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de charger la session.", exception);
        }
    }

    @Transactional
    public void revoke(String rawSessionToken) {
        if (rawSessionToken == null || rawSessionToken.isBlank()) {
            return;
        }
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     UPDATE app_session
                        SET revoked_at = now()
                     WHERE token_hash = ?
                        AND revoked_at IS NULL
                     """)) {
            String tokenHash = tokens.hash(rawSessionToken);
            tenantContext.applySession(connection, tokenHash);
            statement.setString(1, tokenHash);
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de révoquer la session.", exception);
        }
    }

    private SessionIdentity loadSessionIdentity(Connection connection, String tokenHash)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT user_account_id, active_membership_id, organization_id
                  FROM app_session
                 WHERE token_hash = ?
                   AND revoked_at IS NULL
                   AND expires_at > now()
                """)) {
            statement.setString(1, tokenHash);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new SessionIdentity(
                        result.getObject("user_account_id", UUID.class),
                        result.getObject("active_membership_id", UUID.class),
                        result.getObject("organization_id", UUID.class));
            }
        }
    }

    private Optional<SessionContext> loadTenantSessionContext(
            Connection connection,
            SessionIdentity identity) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT ua.display_name,
                       ue.normalized_email,
                       m.role,
                       o.name AS organization_name
                  FROM user_account ua
                  JOIN user_email ue ON ue.user_account_id = ua.id
                                    AND ue.email_type = 'PROFESSIONAL'
                  JOIN membership m ON m.id = ?
                                   AND m.organization_id = ?
                                   AND m.user_account_id = ua.id
                  JOIN organization o ON o.id = m.organization_id
                 WHERE ua.id = ?
                   AND ua.status = 'ACTIVE'
                   AND m.status = 'ACTIVE'
                   AND o.status = 'ACTIVE'
                   AND o.mode <> 'SUSPENDED'
                 ORDER BY ue.created_at
                 LIMIT 1
                """)) {
            statement.setObject(1, identity.membershipId());
            statement.setObject(2, identity.organizationId());
            statement.setObject(3, identity.userId());
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return Optional.empty();
                }
                return Optional.of(new SessionContext(
                        identity.userId(),
                        identity.membershipId(),
                        identity.organizationId(),
                        result.getString("display_name"),
                        result.getString("normalized_email"),
                        result.getString("organization_name"),
                        result.getString("role")));
            }
        }
    }

    private record SessionIdentity(UUID userId, UUID membershipId, UUID organizationId) {
    }
}
