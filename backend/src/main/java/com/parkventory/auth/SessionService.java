package com.parkventory.auth;

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

    public SessionService(AgroalDataSource dataSource, SecurityTokens tokens) {
        this.dataSource = dataSource;
        this.tokens = tokens;
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

        String sql = """
                SELECT ua.id AS user_id,
                       ua.display_name,
                       ue.normalized_email,
                       m.id AS membership_id,
                       m.organization_id,
                       m.role,
                       o.name AS organization_name
                  FROM app_session session
                  JOIN user_account ua ON ua.id = session.user_account_id
                  JOIN membership m ON m.id = session.active_membership_id
                                   AND m.user_account_id = ua.id
                  JOIN organization o ON o.id = m.organization_id
                  JOIN user_email ue ON ue.user_account_id = ua.id
                                    AND ue.email_type = 'PROFESSIONAL'
                 WHERE session.token_hash = ?
                   AND session.revoked_at IS NULL
                   AND session.expires_at > now()
                   AND ua.status = 'ACTIVE'
                   AND m.status = 'ACTIVE'
                   AND o.status = 'ACTIVE'
                 ORDER BY ue.created_at
                 LIMIT 1
                """;

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, tokens.hash(rawSessionToken));
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return Optional.empty();
                }
                return Optional.of(new SessionContext(
                        result.getObject("user_id", UUID.class),
                        result.getObject("membership_id", UUID.class),
                        result.getObject("organization_id", UUID.class),
                        result.getString("display_name"),
                        result.getString("normalized_email"),
                        result.getString("organization_name"),
                        result.getString("role")));
            }
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
            statement.setString(1, tokens.hash(rawSessionToken));
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de révoquer la session.", exception);
        }
    }
}
