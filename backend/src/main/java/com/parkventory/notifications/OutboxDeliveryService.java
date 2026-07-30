package com.parkventory.notifications;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkventory.auth.AuthService;
import io.agroal.api.AgroalDataSource;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

@ApplicationScoped
public class OutboxDeliveryService {
    private static final Logger LOG = Logger.getLogger(OutboxDeliveryService.class);

    private final AgroalDataSource dataSource;
    private final ObjectMapper objectMapper;
    private final AuthService authService;
    private final Mailer mailer;

    public OutboxDeliveryService(
            AgroalDataSource dataSource,
            ObjectMapper objectMapper,
            AuthService authService,
            Mailer mailer) {
        this.dataSource = dataSource;
        this.objectMapper = objectMapper;
        this.authService = authService;
        this.mailer = mailer;
    }

    @Transactional
    public boolean deliverNext() {
        try (Connection connection = dataSource.getConnection()) {
            PendingEvent event = lockNext(connection);
            if (event == null) {
                return false;
            }
            try {
                deliver(connection, event);
                markDelivered(connection, event.id());
            } catch (RuntimeException | SQLException exception) {
                LOG.warnf(
                        exception,
                        "Échec de livraison de l’événement outbox %s (%s)",
                        event.id(),
                        event.eventType());
                markForRetry(connection, event.id());
            }
            return true;
        } catch (SQLException exception) {
            LOG.warn("Impossible de lire l’outbox.", exception);
            return false;
        }
    }

    private PendingEvent lockNext(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT id, event_type, payload
                  FROM outbox_event
                 WHERE delivered_at IS NULL
                   AND next_attempt_at <= now()
                   AND event_type IN ('INVITATION_REQUESTED', 'RESERVATION_CONFIRMED')
                 ORDER BY created_at
                 LIMIT 1
                 FOR UPDATE SKIP LOCKED
                """);
             ResultSet result = statement.executeQuery()) {
            if (!result.next()) {
                return null;
            }
            try {
                return new PendingEvent(
                        result.getObject("id", UUID.class),
                        result.getString("event_type"),
                        objectMapper.readTree(result.getString("payload")));
            } catch (Exception exception) {
                throw new IllegalStateException("Payload d’outbox illisible.", exception);
            }
        }
    }

    private void deliver(Connection connection, PendingEvent event) throws SQLException {
        String email = requiredText(event.payload(), "email");
        if ("INVITATION_REQUESTED".equals(event.eventType())) {
            authService.sendInvitationMagicLink(connection, email);
            return;
        }
        if ("RESERVATION_CONFIRMED".equals(event.eventType())) {
            String reserver = requiredText(event.payload(), "reserverName");
            String spot = requiredText(event.payload(), "spot");
            String startsAt = requiredText(event.payload(), "startsAt");
            mailer.send(Mail.withText(
                    email,
                    "Votre place " + spot + " a été réservée",
                    """
                            %s a réservé votre place %s.

                            Début du créneau : %s

                            Vous pouvez retrouver ce partage dans Parkventory.
                            """.formatted(reserver, spot, startsAt)));
            return;
        }
        throw new IllegalStateException("Type d’événement non pris en charge.");
    }

    private void markDelivered(Connection connection, UUID eventId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE outbox_event
                   SET delivered_at = now(), attempts = attempts + 1
                 WHERE id = ?
                """)) {
            statement.setObject(1, eventId);
            statement.executeUpdate();
        }
    }

    private void markForRetry(Connection connection, UUID eventId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE outbox_event
                   SET attempts = attempts + 1,
                       next_attempt_at = now()
                           + make_interval(secs => LEAST(300, power(2, attempts + 1)::int))
                 WHERE id = ?
                """)) {
            statement.setObject(1, eventId);
            statement.executeUpdate();
        }
    }

    private static String requiredText(JsonNode payload, String field) {
        JsonNode value = payload.get(field);
        if (value == null || !value.isTextual() || value.asText().isBlank()) {
            throw new IllegalStateException("Champ d’outbox absent : " + field);
        }
        return value.asText();
    }

    private record PendingEvent(UUID id, String eventType, JsonNode payload) {
    }
}
