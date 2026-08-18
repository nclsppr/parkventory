package com.parkventory.auth;

import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;

public class OidcPostgresTestResource implements QuarkusTestResourceLifecycleManager {
    private static final DockerImageName IMAGE = DockerImageName.parse(
            "docker.io/library/postgres:18.3-alpine@sha256:54451ecb8ab38c24c3ec123f2fd501303a3a1856a5c66e98cecf2460d5e1e9d7")
            .asCompatibleSubstituteFor("postgres");

    private PostgreSQLContainer postgres;
    private static final String RUNTIME_USER = "parkventory_oidc_runtime";
    private static final String RUNTIME_PASSWORD = "parkventory-oidc-runtime-test-only";

    @Override
    public Map<String, String> start() {
        postgres = new PostgreSQLContainer(IMAGE)
                .withDatabaseName("parkventory")
                .withUsername("parkventory")
                .withPassword("parkventory-test-only");
        postgres.start();
        prepareRuntimeRole();
        return Map.of(
                "PARKVENTORY_JDBC_URL", postgres.getJdbcUrl(),
                "PARKVENTORY_DB_USER", RUNTIME_USER,
                "PARKVENTORY_DB_PASSWORD", RUNTIME_PASSWORD,
                "quarkus.datasource.jdbc.url", postgres.getJdbcUrl(),
                "quarkus.datasource.username", RUNTIME_USER,
                "quarkus.datasource.password", RUNTIME_PASSWORD,
                "quarkus.flyway.jdbc-url", postgres.getJdbcUrl(),
                "quarkus.flyway.username", postgres.getUsername(),
                "quarkus.flyway.password", postgres.getPassword());
    }

    private void prepareRuntimeRole() {
        try (var connection = DriverManager.getConnection(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Statement statement = connection.createStatement()) {
            statement.execute("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
            statement.execute("""
                    CREATE ROLE parkventory_oidc_runtime
                      LOGIN PASSWORD 'parkventory-oidc-runtime-test-only'
                      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS
                    """);
            statement.execute("GRANT CONNECT ON DATABASE parkventory TO parkventory_oidc_runtime");
            statement.execute("GRANT USAGE ON SCHEMA public TO parkventory_oidc_runtime");
            statement.execute("""
                    ALTER DEFAULT PRIVILEGES FOR ROLE parkventory IN SCHEMA public
                    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO parkventory_oidc_runtime
                    """);
            statement.execute("""
                    ALTER DEFAULT PRIVILEGES FOR ROLE parkventory IN SCHEMA public
                    GRANT USAGE, SELECT ON SEQUENCES TO parkventory_oidc_runtime
                    """);
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de préparer le rôle runtime OIDC.", exception);
        }
    }

    @Override
    public void stop() {
        if (postgres != null) {
            postgres.stop();
        }
    }
}
