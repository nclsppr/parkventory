package com.parkventory.tenancy;

import com.parkventory.notifications.OutboxDeliveryService;
import io.agroal.api.AgroalDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class TenantIsolationTest {
    private static final String[] TENANT_TABLES = {
            "user_account",
            "user_email",
            "magic_link_request",
            "app_session",
            "organization",
            "organization_domain",
            "membership",
            "invitation",
            "admin_claim",
            "parking_site",
            "parking_spot",
            "spot_assignment",
            "availability_offer",
            "reservation",
            "idempotency_record",
            "outbox_event",
            "audit_event"
    };

    @Inject
    AgroalDataSource dataSource;

    @Inject
    TenantTransactionContext tenantContext;

    @Inject
    OutboxDeliveryService outboxDelivery;

    @Test
    void tenantTablesEnableAndForceRowLevelSecurity() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     SELECT relname, relrowsecurity, relforcerowsecurity
                       FROM pg_class
                      WHERE relnamespace = 'public'::regnamespace
                        AND relname = ANY (?)
                     """)) {
            statement.setArray(1, connection.createArrayOf("text", TENANT_TABLES));
            int protectedTables = 0;
            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    assertTrue(result.getBoolean("relrowsecurity"), result.getString("relname"));
                    assertTrue(result.getBoolean("relforcerowsecurity"), result.getString("relname"));
                    protectedTables += 1;
                }
            }
            assertEquals(TENANT_TABLES.length, protectedTables);
        }
    }

    @Test
    void nonOwnerRuntimeRoleCannotReadOrMutateAnotherTenant() throws Exception {
        String role = "parkventory_rls_" + UUID.randomUUID().toString().replace("-", "");
        UUID tenantA = UUID.randomUUID();
        UUID tenantB = UUID.randomUUID();
        UUID spotA = UUID.randomUUID();
        UUID spotB = UUID.randomUUID();

        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(true);
            createRuntimeRole(connection, role);
            insertTenantFixture(connection, tenantA, spotA, "tenant-a.test", "A-01");
            insertTenantFixture(connection, tenantB, spotB, "tenant-b.test", "B-01");

            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement()) {
                statement.execute("SET ROLE " + role);
                assertFalse(booleanScalar(statement, "SELECT rolsuper FROM pg_roles WHERE rolname = current_user"));
                assertFalse(booleanScalar(statement, "SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user"));

                assertEquals(0, intScalar(statement, "SELECT count(*) FROM organization"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM parking_spot"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM user_account"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM user_email"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM magic_link_request"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM app_session"));
                assertEquals(0, statement.executeUpdate(
                        "UPDATE parking_spot SET level_label = 'forbidden' WHERE id = '" + spotB + "'"));

                tenantContext.applyTenant(connection, UUID.randomUUID());
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM organization"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM parking_spot"));

                tenantContext.applyTenant(connection, tenantA);
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM organization"));
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM organization_domain"));
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM membership"));
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM parking_site"));
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM parking_spot"));
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM user_account"));
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM user_email"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM magic_link_request"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM app_session"));
                assertEquals(0, intScalar(statement,
                        "SELECT count(*) FROM parking_spot WHERE id = '" + spotB + "'"));
                assertEquals(0, statement.executeUpdate(
                        "UPDATE parking_spot SET level_label = 'forbidden' WHERE id = '" + spotB + "'"));
                assertEquals(1, statement.executeUpdate(
                        "UPDATE parking_spot SET level_label = 'allowed' WHERE id = '" + spotA + "'"));
            }
            connection.rollback();

            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement()) {
                statement.execute("SET ROLE " + role);
                tenantContext.applyTenant(connection, tenantA);
                SQLException rejected = assertThrows(SQLException.class, () -> statement.executeUpdate("""
                        INSERT INTO parking_site (organization_id, name, timezone)
                        VALUES ('%s', 'Cross tenant', 'Europe/Paris')
                        """.formatted(tenantB)));
                assertEquals("42501", rejected.getSQLState());
            }
            connection.rollback();

            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement()) {
                statement.execute("SET ROLE " + role);
                tenantContext.applyVerifiedIdentity(
                        connection,
                        "verified@tenant-a.test",
                        "tenant-a.test");
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM organization_domain"));
                assertEquals(1, intScalar(statement, "SELECT count(*) FROM invitation"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM organization"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM parking_spot"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM user_account"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM user_email"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM magic_link_request"));
                assertEquals(0, intScalar(statement, "SELECT count(*) FROM app_session"));
            }
            connection.rollback();

            connection.setAutoCommit(true);
            try (Statement statement = connection.createStatement()) {
                statement.execute("RESET ROLE");
                assertEquals("Niveau B", stringScalar(statement,
                        "SELECT level_label FROM parking_spot WHERE id = '" + spotB + "'"));
            }
        } finally {
            dropRuntimeRole(role);
        }
    }

    @Test
    void outboxRetryKeepsTheGlobalDispatchScheduleAligned() throws SQLException {
        UUID organizationId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     INSERT INTO organization (id, name) VALUES (?, 'Retry tenant');
                     INSERT INTO outbox_event (
                         id,
                         organization_id,
                         event_type,
                         aggregate_type,
                         payload
                     ) VALUES (?, ?, 'INVITATION_REQUESTED', 'INVITATION', '{}'::jsonb);
                     INSERT INTO outbox_dispatch (event_id, organization_id) VALUES (?, ?);
                     """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, eventId);
            statement.setObject(3, organizationId);
            statement.setObject(4, eventId);
            statement.setObject(5, organizationId);
            statement.execute();
        }

        for (int attempt = 0; attempt < 20 && attemptsFor(eventId) == 0; attempt += 1) {
            outboxDelivery.deliverNext();
        }

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     SELECT event.attempts, event.next_attempt_at, dispatch.available_at
                       FROM outbox_event event
                       JOIN outbox_dispatch dispatch ON dispatch.event_id = event.id
                      WHERE event.id = ?
                     """)) {
            statement.setObject(1, eventId);
            try (ResultSet result = statement.executeQuery()) {
                assertTrue(result.next());
                assertEquals(1, result.getInt("attempts"));
                assertEquals(
                        result.getObject("next_attempt_at", OffsetDateTime.class),
                        result.getObject("available_at", OffsetDateTime.class));
            }
        }
    }

    private void createRuntimeRole(Connection connection, String role) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE ROLE " + role + " NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
            statement.execute("GRANT USAGE ON SCHEMA public TO " + role);
            statement.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO " + role);
            statement.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO " + role);
        }
    }

    private void insertTenantFixture(
            Connection connection,
            UUID organizationId,
            UUID spotId,
            String domain,
            String spotLabel) throws SQLException {
        UUID userId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        UUID siteId = UUID.randomUUID();
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO organization (id, name) VALUES (?, ?);
                INSERT INTO organization_domain (organization_id, normalized_domain)
                    VALUES (?, ?);
                INSERT INTO user_account (id, display_name, status) VALUES (?, ?, 'ACTIVE');
                INSERT INTO membership (id, organization_id, user_account_id, status)
                    VALUES (?, ?, ?, 'ACTIVE');
                INSERT INTO parking_site (id, organization_id, name, timezone)
                    VALUES (?, ?, 'Parking principal', 'Europe/Paris');
                INSERT INTO parking_spot (id, organization_id, parking_site_id, label, level_label)
                    VALUES (?, ?, ?, ?, 'Niveau B');
                """)) {
            statement.setObject(1, organizationId);
            statement.setString(2, domain);
            statement.setObject(3, organizationId);
            statement.setString(4, domain);
            statement.setObject(5, userId);
            statement.setString(6, "User " + domain);
            statement.setObject(7, membershipId);
            statement.setObject(8, organizationId);
            statement.setObject(9, userId);
            statement.setObject(10, siteId);
            statement.setObject(11, organizationId);
            statement.setObject(12, spotId);
            statement.setObject(13, organizationId);
            statement.setObject(14, siteId);
            statement.setString(15, spotLabel);
            statement.execute();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO invitation (
                    organization_id,
                    invited_by_membership_id,
                    normalized_email,
                    token_hash,
                    expires_at
                ) VALUES (?, ?, ?, ?, now() + interval '1 day')
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, membershipId);
            statement.setString(3, "verified@" + domain);
            statement.setString(4, UUID.randomUUID().toString());
            statement.executeUpdate();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO user_email (
                    user_account_id,
                    normalized_email,
                    verified_at
                ) VALUES (?, ?, now());
                INSERT INTO magic_link_request (
                    normalized_email,
                    token_hash,
                    expires_at
                ) VALUES (?, ?, now() + interval '1 day');
                INSERT INTO app_session (
                    user_account_id,
                    active_membership_id,
                    organization_id,
                    token_hash,
                    expires_at
                ) VALUES (?, ?, ?, ?, now() + interval '1 day');
                """)) {
            statement.setObject(1, userId);
            statement.setString(2, "member@" + domain);
            statement.setString(3, "member@" + domain);
            statement.setString(4, UUID.randomUUID().toString().replace("-", ""));
            statement.setObject(5, userId);
            statement.setObject(6, membershipId);
            statement.setObject(7, organizationId);
            statement.setString(8, UUID.randomUUID().toString().replace("-", ""));
            statement.execute();
        }
    }

    private void dropRuntimeRole(String role) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("RESET ROLE");
            statement.execute("DROP OWNED BY " + role);
            statement.execute("DROP ROLE " + role);
        }
    }

    private int attemptsFor(UUID eventId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                     SELECT attempts FROM outbox_event WHERE id = ?
                     """)) {
            statement.setObject(1, eventId);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        }
    }

    private static int intScalar(Statement statement, String sql) throws SQLException {
        try (ResultSet result = statement.executeQuery(sql)) {
            result.next();
            return result.getInt(1);
        }
    }

    private static boolean booleanScalar(Statement statement, String sql) throws SQLException {
        try (ResultSet result = statement.executeQuery(sql)) {
            result.next();
            return result.getBoolean(1);
        }
    }

    private static String stringScalar(Statement statement, String sql) throws SQLException {
        try (ResultSet result = statement.executeQuery(sql)) {
            result.next();
            return result.getString(1);
        }
    }
}
