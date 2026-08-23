package com.parkventory;

import io.agroal.api.AgroalDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
class PostgresCompatibilityTest {
    @Inject
    AgroalDataSource dataSource;

    @ConfigProperty(name = "parkventory.test.expected-postgres-version")
    String expectedVersion;

    @Test
    void runsTheCompleteSchemaOnTheExpectedPostgresPatch() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            assertEquals(expectedVersion, scalar(statement, "SHOW server_version"));
            assertEquals("4", scalar(statement, """
                    SELECT version
                    FROM flyway_schema_history
                    WHERE success
                    ORDER BY installed_rank DESC
                    LIMIT 1
                    """));
            assertEquals("1", scalar(statement, """
                    SELECT count(*)
                    FROM pg_extension
                    WHERE extname = 'btree_gist'
                    """));
            assertEquals("3", scalar(statement, """
                    SELECT count(*)
                    FROM pg_constraint
                    WHERE contype = 'x'
                      AND conname IN (
                        'spot_assignment_no_active_overlap',
                        'reservation_no_active_overlap',
                        'availability_offer_no_published_overlap'
                      )
                    """));
            assertEquals("17", scalar(statement, """
                    SELECT count(*)
                    FROM pg_class
                    WHERE relnamespace = 'public'::regnamespace
                      AND relrowsecurity
                      AND relforcerowsecurity
                      AND relname IN (
                        'user_account',
                        'user_email',
                        'magic_link_request',
                        'app_session',
                        'organization',
                        'organization_domain',
                        'membership',
                        'invitation',
                        'admin_claim',
                        'parking_site',
                        'parking_spot',
                        'spot_assignment',
                        'availability_offer',
                        'reservation',
                        'idempotency_record',
                        'outbox_event',
                        'audit_event'
                      )
                    """));
            assertEquals("1", scalar(statement, """
                    SELECT count(*)
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = 'outbox_dispatch'
                    """));
        }
    }

    private static String scalar(Statement statement, String query) throws SQLException {
        try (ResultSet result = statement.executeQuery(query)) {
            if (!result.next()) {
                throw new SQLException("La requête de compatibilité PostgreSQL ne retourne aucune ligne.");
            }
            return result.getString(1);
        }
    }
}
