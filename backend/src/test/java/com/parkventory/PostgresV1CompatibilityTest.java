package com.parkventory;

import io.agroal.api.AgroalDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
@EnabledIfSystemProperty(named = "parkventory.test.v1", matches = "true")
class PostgresV1CompatibilityTest {
    @Inject
    AgroalDataSource dataSource;

    @ConfigProperty(name = "parkventory.test.expected-postgres-version")
    String expectedVersion;

    @Test
    void stopsAtV1OnTheExpectedPostgresPatch() throws SQLException {
        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("1"))
                .load()
                .migrate();

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            assertEquals(expectedVersion, scalar(statement, "SHOW server_version"));
            assertEquals("1", scalar(statement, """
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
            assertEquals("2", scalar(statement, """
                    SELECT count(*)
                    FROM pg_constraint
                    WHERE contype = 'x'
                      AND conname IN (
                        'spot_assignment_no_active_overlap',
                        'reservation_no_active_overlap'
                      )
                    """));
            assertEquals("0", scalar(statement, """
                    SELECT count(*)
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name IN ('magic_link_request', 'app_session')
                    """));
        }
    }

    private static String scalar(Statement statement, String query) throws SQLException {
        try (ResultSet result = statement.executeQuery(query)) {
            if (!result.next()) {
                throw new SQLException("La requête de compatibilité PostgreSQL V1 ne retourne aucune ligne.");
            }
            return result.getString(1);
        }
    }
}
