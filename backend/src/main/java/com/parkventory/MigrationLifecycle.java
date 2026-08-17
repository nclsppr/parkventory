package com.parkventory;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.flywaydb.core.Flyway;
import org.jboss.logging.Logger;

@ApplicationScoped
public class MigrationLifecycle {
    private static final Logger LOG = Logger.getLogger(MigrationLifecycle.class);

    private final Flyway flyway;
    private final boolean migrationOnly;

    public MigrationLifecycle(
            Flyway flyway,
            @ConfigProperty(name = "parkventory.migration-only", defaultValue = "false")
                    boolean migrationOnly) {
        this.flyway = flyway;
        this.migrationOnly = migrationOnly;
    }

    void migrateAndExit(@Observes StartupEvent event) {
        if (!migrationOnly) {
            return;
        }
        var result = flyway.migrate();
        LOG.infof(
                "Migration Parkventory terminée : schéma %s, %d migration(s) appliquée(s).",
                result.schemaName,
                result.migrationsExecuted);
        Quarkus.asyncExit();
    }
}
