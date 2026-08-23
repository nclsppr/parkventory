package com.parkventory;

import com.parkventory.tenancy.TenantTransactionContext;
import io.agroal.api.AgroalDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@EnabledIfSystemProperty(named = "parkventory.test.v4-upgrade", matches = "true")
class PostgresV4UpgradeCompatibilityTest {
    @Inject
    AgroalDataSource dataSource;

    @Inject
    TenantTransactionContext tenantContext;

    @Test
    void upgradesANonEmptyV3SchemaAsTheNonBypassOwner() throws SQLException {
        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("3"))
                .load()
                .migrate();

        UUID organizationId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID aggregateId = UUID.randomUUID();
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     INSERT INTO organization (id, name) VALUES (?, 'V4 upgrade tenant');
                     INSERT INTO outbox_event (
                         id, organization_id, event_type, aggregate_type,
                         aggregate_id, payload
                     ) VALUES (
                         ?, ?, 'RESERVATION_CONFIRMED', 'RESERVATION', ?, '{}'::jsonb
                     );
                     INSERT INTO outbox_dispatch (event_id, organization_id)
                     VALUES (?, ?);
                     """)) {
            connection.setAutoCommit(false);
            tenantContext.applyTenant(connection, organizationId);
            statement.setObject(1, organizationId);
            statement.setObject(2, eventId);
            statement.setObject(3, organizationId);
            statement.setObject(4, aggregateId);
            statement.setObject(5, eventId);
            statement.setObject(6, organizationId);
            statement.execute();
            connection.commit();
        }

        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        try (Connection connection = dataSource.getConnection();
             PreparedStatement dispatch = connection.prepareStatement("""
                     SELECT aggregate_type, aggregate_id
                       FROM outbox_dispatch
                      WHERE event_id = ?
                     """);
             Statement metadata = connection.createStatement()) {
            dispatch.setObject(1, eventId);
            try (ResultSet result = dispatch.executeQuery()) {
                assertTrue(result.next());
                assertEquals("RESERVATION", result.getString("aggregate_type"));
                assertEquals(aggregateId, result.getObject("aggregate_id", UUID.class));
            }
            assertEquals("5", scalar(metadata, """
                    SELECT version
                      FROM flyway_schema_history
                     WHERE success
                     ORDER BY installed_rank DESC
                     LIMIT 1
                    """));
            assertEquals("true", scalar(metadata, """
                    SELECT relforcerowsecurity::text
                      FROM pg_class
                     WHERE oid = 'public.outbox_event'::regclass
                    """));
            assertEquals("false,false", scalar(metadata, """
                    SELECT rolsuper::text || ',' || rolbypassrls::text
                      FROM pg_roles
                     WHERE rolname = current_user
                    """));
        }

        try (Connection connection = dataSource.getConnection();
             PreparedStatement cleanup = connection.prepareStatement("""
                     DELETE FROM outbox_dispatch WHERE event_id = ?;
                     DELETE FROM outbox_event
                      WHERE id = ? AND organization_id = ?;
                     DELETE FROM organization WHERE id = ?;
                     """)) {
            connection.setAutoCommit(false);
            tenantContext.applyTenant(connection, organizationId);
            cleanup.setObject(1, eventId);
            cleanup.setObject(2, eventId);
            cleanup.setObject(3, organizationId);
            cleanup.setObject(4, organizationId);
            cleanup.execute();
            connection.commit();
        }
    }

    private static String scalar(Statement statement, String query) throws SQLException {
        try (ResultSet result = statement.executeQuery(query)) {
            if (!result.next()) {
                throw new SQLException("La preuve de reprise V3 vers le catalogue courant ne retourne aucune ligne.");
            }
            return result.getString(1);
        }
    }
}
