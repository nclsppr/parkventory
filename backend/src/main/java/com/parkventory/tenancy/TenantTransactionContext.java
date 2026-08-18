package com.parkventory.tenancy;

import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Objects;
import java.util.UUID;

@ApplicationScoped
public class TenantTransactionContext {
    public void applyTenant(Connection connection, UUID organizationId) throws SQLException {
        requireTransaction(connection);
        setLocal(connection, "app.organization_id", Objects.requireNonNull(organizationId).toString());
    }

    public void applyVerifiedIdentity(
            Connection connection,
            String normalizedEmail,
            String normalizedDomain) throws SQLException {
        requireTransaction(connection);
        setLocal(connection, "app.verified_email", Objects.requireNonNull(normalizedEmail));
        setLocal(connection, "app.verified_domain", Objects.requireNonNull(normalizedDomain));
    }

    public void applyIdentityUser(Connection connection, UUID userId) throws SQLException {
        requireTransaction(connection);
        setLocal(connection, "app.identity_user_id", Objects.requireNonNull(userId).toString());
    }

    public void applyRequestedEmail(Connection connection, String normalizedEmail)
            throws SQLException {
        requireTransaction(connection);
        setLocal(connection, "app.requested_email", Objects.requireNonNull(normalizedEmail));
    }

    public void applyMagicLink(Connection connection, String tokenHash) throws SQLException {
        requireTransaction(connection);
        setLocal(connection, "app.magic_link_hash", Objects.requireNonNull(tokenHash));
    }

    public void applySession(Connection connection, String tokenHash) throws SQLException {
        requireTransaction(connection);
        setLocal(connection, "app.session_hash", Objects.requireNonNull(tokenHash));
    }

    private static void setLocal(Connection connection, String setting, String value)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT set_config(?, ?, true)")) {
            statement.setString(1, setting);
            statement.setString(2, value);
            statement.executeQuery().close();
        }
    }

    private static void requireTransaction(Connection connection) throws SQLException {
        if (connection.getAutoCommit()) {
            throw new SQLException("Le contexte tenant exige une transaction active.");
        }
    }
}
