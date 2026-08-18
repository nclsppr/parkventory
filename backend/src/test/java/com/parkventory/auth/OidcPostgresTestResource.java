package com.parkventory.auth;

import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.Map;

public class OidcPostgresTestResource implements QuarkusTestResourceLifecycleManager {
    private static final DockerImageName IMAGE = DockerImageName.parse(
            "docker.io/library/postgres:18.3-alpine@sha256:54451ecb8ab38c24c3ec123f2fd501303a3a1856a5c66e98cecf2460d5e1e9d7")
            .asCompatibleSubstituteFor("postgres");

    private PostgreSQLContainer postgres;

    @Override
    public Map<String, String> start() {
        postgres = new PostgreSQLContainer(IMAGE)
                .withDatabaseName("parkventory")
                .withUsername("parkventory")
                .withPassword("parkventory-test-only");
        postgres.start();
        return Map.of(
                "PARKVENTORY_JDBC_URL", postgres.getJdbcUrl(),
                "PARKVENTORY_DB_USER", postgres.getUsername(),
                "PARKVENTORY_DB_PASSWORD", postgres.getPassword(),
                "quarkus.datasource.jdbc.url", postgres.getJdbcUrl(),
                "quarkus.datasource.username", postgres.getUsername(),
                "quarkus.datasource.password", postgres.getPassword());
    }

    @Override
    public void stop() {
        if (postgres != null) {
            postgres.stop();
        }
    }
}
