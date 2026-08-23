package com.parkventory.dashboard;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkventory.auth.ProfessionalEmail;
import com.parkventory.auth.SecurityTokens;
import com.parkventory.auth.SessionContext;
import com.parkventory.tenancy.TenantTransactionContext;
import io.agroal.api.AgroalDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.FormatStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static com.parkventory.dashboard.ApiModels.*;

@ApplicationScoped
public class DashboardService {
    private static final int MAX_ACTIVE_SHARE_LIMIT = 366;
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(Locale.FRANCE);
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm", Locale.FRANCE);

    private final AgroalDataSource dataSource;
    private final SecurityTokens tokens;
    private final ObjectMapper objectMapper;
    private final TenantTransactionContext tenantContext;
    private final int invitationDailyLimit;
    private final int activeShareLimit;

    public DashboardService(
            AgroalDataSource dataSource,
            SecurityTokens tokens,
            ObjectMapper objectMapper,
            TenantTransactionContext tenantContext,
            @ConfigProperty(
                    name = "parkventory.security.invitation.daily-limit",
                    defaultValue = "20") int invitationDailyLimit,
            @ConfigProperty(
                    name = "parkventory.sharing.active-limit",
                    defaultValue = "366") int activeShareLimit) {
        this.dataSource = dataSource;
        this.tokens = tokens;
        this.objectMapper = objectMapper;
        this.tenantContext = tenantContext;
        if (invitationDailyLimit < 1) {
            throw new IllegalArgumentException("Le quota quotidien d’invitations doit être positif.");
        }
        this.invitationDailyLimit = invitationDailyLimit;
        if (activeShareLimit < 1 || activeShareLimit > MAX_ACTIVE_SHARE_LIMIT) {
            throw new IllegalArgumentException(
                    "La limite de partages actifs doit être comprise entre 1 et 366.");
        }
        this.activeShareLimit = activeShareLimit;
    }

    @Transactional
    public Dashboard dashboard(SessionContext session) {
        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyTenant(connection, session.organizationId());
            AssignedSpot assignedSpot = loadAssignedSpot(connection, session);
            int sharedTotal = count(connection, """
                    SELECT count(*)
                      FROM availability_offer
                     WHERE organization_id = ?
                    """, session.organizationId());
            int shares = count(connection, """
                    SELECT count(*)
                      FROM availability_offer
                     WHERE organization_id = ?
                       AND offered_by_membership_id = ?
                       AND created_at >= date_trunc('week', now())
                    """, session.organizationId(), session.membershipId());
            int reservations = count(connection, """
                    SELECT count(*)
                      FROM reservation
                     WHERE organization_id = ?
                       AND reserved_by_membership_id = ?
                       AND status = 'CONFIRMED'
                       AND created_at >= date_trunc('week', now())
                    """, session.organizationId(), session.membershipId());
            int availableSpots = count(connection, """
                    SELECT count(*)
                      FROM availability_offer offer
                     WHERE offer.organization_id = ?
                       AND offer.offered_by_membership_id <> ?
                       AND offer.status = 'PUBLISHED'
                       AND offer.ends_at > now()
                       AND offer.starts_at < now() + interval '7 days'
                       AND NOT EXISTS (
                           SELECT 1
                             FROM reservation reserved
                            WHERE reserved.availability_offer_id = offer.id
                              AND reserved.status IN ('HELD', 'CONFIRMED')
                       )
                    """, session.organizationId(), session.membershipId());

            return new Dashboard(
                    false,
                    new User(
                            firstName(session.displayName()),
                            session.displayName(),
                            initials(session.displayName()),
                            assignedSpot == null ? null : assignedSpot.label(),
                            assignedSpot == null ? null : assignedSpot.level(),
                            assignedSpot == null ? null : assignedSpot.timeZone()),
                    new Organization(session.organizationName(), sharedTotal),
                    new Stats(shares, reservations, availableSpots),
                    loadAvailability(connection, session),
                    loadActiveShares(connection, session),
                    List.of());
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de charger le tableau de bord.", exception);
        }
    }

    @Transactional
    public ActionResponse declareSpot(SessionContext session, SpotRequest request) {
        String label = normalizeSpotLabel(request.label());
        String level = normalizeLevel(request.level());

        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyTenant(connection, session.organizationId());
            UUID siteId = loadPrimarySite(connection, session.organizationId());
            AssignedSpotWithIds current = loadAssignedSpotForUpdate(connection, session);
            if (current != null && current.label().equals(label)) {
                updateSpotLevel(connection, current.spotId(), level);
                return new ActionResponse(
                        true,
                        "La place " + label + " est déjà affectée à votre profil.");
            }

            if (current != null) {
                try (PreparedStatement statement = connection.prepareStatement("""
                        UPDATE spot_assignment
                           SET status = 'ENDED', ends_at = now()
                         WHERE id = ?
                        """)) {
                    statement.setObject(1, current.assignmentId());
                    statement.executeUpdate();
                }
            }

            UUID spotId = findOrCreateSpot(
                    connection,
                    session.organizationId(),
                    siteId,
                    label,
                    level);
            UUID assignmentId;
            try (PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO spot_assignment (
                        organization_id,
                        parking_spot_id,
                        membership_id,
                        starts_at,
                        status
                    ) VALUES (?, ?, ?, now(), 'ACTIVE')
                    RETURNING id
                    """)) {
                statement.setObject(1, session.organizationId());
                statement.setObject(2, spotId);
                statement.setObject(3, session.membershipId());
                try (ResultSet result = statement.executeQuery()) {
                    result.next();
                    assignmentId = result.getObject("id", UUID.class);
                }
            }
            insertAudit(
                    connection,
                    session,
                    "SPOT_ASSIGNMENT_DECLARED",
                    "SPOT_ASSIGNMENT",
                    assignmentId);
            return new ActionResponse(
                    true,
                    "La place " + label + " est maintenant affectée à votre profil.");
        } catch (SQLException exception) {
            if (isConflict(exception)) {
                throw new ClientErrorException(
                        "Cette place est déjà affectée à un autre collègue.", 409);
            }
            throw new IllegalStateException("Impossible d’affecter la place.", exception);
        }
    }

    @Transactional
    public ActionResponse share(SessionContext session, ShareRequest request) {
        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyTenant(connection, session.organizationId());
            ShareAssignment assignment = loadShareAssignment(connection, session);
            if (assignment == null) {
                throw new ClientErrorException(
                        "Déclarez d’abord la place qui vous est affectée.", 409);
            }
            String requestedSpot = normalizeSpotLabel(request.spot());
            if (!assignment.label().equals(requestedSpot)) {
                throw new ClientErrorException(
                        "Vous ne pouvez partager que la place affectée à votre profil.", 403);
            }

            TimeWindow window = parseTimeWindow(request, assignment.timezone());
            enforceActiveShareLimit(connection, session);
            UUID offerId;
            try (PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO availability_offer (
                        organization_id,
                        parking_spot_id,
                        spot_assignment_id,
                        offered_by_membership_id,
                        starts_at,
                        ends_at,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED')
                    RETURNING id
                    """)) {
                statement.setObject(1, session.organizationId());
                statement.setObject(2, assignment.spotId());
                statement.setObject(3, assignment.assignmentId());
                statement.setObject(4, session.membershipId());
                statement.setObject(
                        5,
                        OffsetDateTime.ofInstant(window.startsAt(), ZoneOffset.UTC));
                statement.setObject(
                        6,
                        OffsetDateTime.ofInstant(window.endsAt(), ZoneOffset.UTC));
                try (ResultSet result = statement.executeQuery()) {
                    result.next();
                    offerId = result.getObject("id", UUID.class);
                }
            }
            insertAudit(
                    connection,
                    session,
                    "AVAILABILITY_PUBLISHED",
                    "AVAILABILITY_OFFER",
                    offerId);
            return new ActionResponse(
                    true,
                    "La place " + assignment.label() + " est disponible pour vos collègues.");
        } catch (SQLException exception) {
            if (isConflict(exception)) {
                throw new ClientErrorException(
                        "Cette place est déjà partagée sur tout ou partie de ce créneau.", 409);
            }
            throw new IllegalStateException("Impossible de publier la disponibilité.", exception);
        }
    }

    @Transactional
    public ActionResponse reserve(
            SessionContext session,
            String rawAvailabilityId,
            String idempotencyKey) {
        UUID availabilityId = parseUuid(rawAvailabilityId, "Disponibilité introuvable.");
        validateIdempotencyKey(idempotencyKey);

        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyTenant(connection, session.organizationId());
            ReservationOffer offer = loadReservationOffer(
                    connection,
                    session.organizationId(),
                    availabilityId);
            if (offer == null) {
                throw new ClientErrorException("Disponibilité introuvable.", 404);
            }
            UUID existingAvailabilityId = loadReservationAvailabilityForKey(
                    connection,
                    session,
                    idempotencyKey);
            if (existingAvailabilityId != null) {
                if (existingAvailabilityId.equals(availabilityId)) {
                    return new ActionResponse(
                            true,
                            "Cette réservation avait déjà été confirmée.");
                }
                throw new ClientErrorException(
                        "Cette clé d’idempotence a déjà servi pour une autre réservation.",
                        409);
            }
            if (offer.ownerMembershipId().equals(session.membershipId())) {
                throw new ClientErrorException(
                        "Vous ne pouvez pas réserver votre propre place.", 409);
            }
            if (!"PUBLISHED".equals(offer.status()) || !offer.endsAt().isAfter(Instant.now())) {
                throw new ClientErrorException(
                        "Cette disponibilité n’est plus réservable.", 409);
            }

            UUID reservationId;
            try (PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO reservation (
                        organization_id,
                        availability_offer_id,
                        parking_spot_id,
                        reserved_by_membership_id,
                        starts_at,
                        ends_at,
                        status,
                        idempotency_key
                    ) VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
                    RETURNING id
                    """)) {
                statement.setObject(1, session.organizationId());
                statement.setObject(2, availabilityId);
                statement.setObject(3, offer.spotId());
                statement.setObject(4, session.membershipId());
                statement.setObject(
                        5,
                        OffsetDateTime.ofInstant(offer.startsAt(), ZoneOffset.UTC));
                statement.setObject(
                        6,
                        OffsetDateTime.ofInstant(offer.endsAt(), ZoneOffset.UTC));
                statement.setString(7, idempotencyKey);
                try (ResultSet result = statement.executeQuery()) {
                    result.next();
                    reservationId = result.getObject("id", UUID.class);
                }
            }

            String ownerEmail = loadMembershipEmail(connection, offer.ownerMembershipId());
            insertOutbox(
                    connection,
                    session.organizationId(),
                    "RESERVATION_CONFIRMED",
                    "RESERVATION",
                    reservationId,
                    Map.of(
                            "email", ownerEmail,
                            "reserverName", session.displayName(),
                            "spot", offer.spotLabel(),
                            "startsAt", offer.startsAt().toString()));
            insertAudit(
                    connection,
                    session,
                    "RESERVATION_CONFIRMED",
                    "RESERVATION",
                    reservationId);
            return new ActionResponse(
                    true,
                    "La place " + offer.spotLabel() + " est réservée.");
        } catch (SQLException exception) {
            if (isConflict(exception)) {
                throw new ClientErrorException(
                        "Cette place vient d’être réservée par un autre collègue.", 409);
            }
            throw new IllegalStateException("Impossible de confirmer la réservation.", exception);
        }
    }

    @Transactional
    public ActionResponse cancelReservation(
            SessionContext session,
            String rawReservationId) {
        UUID reservationId = parseUuid(rawReservationId, "Réservation introuvable.");

        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyTenant(connection, session.organizationId());
            CancellableReservation reservation = loadCancellableReservationForUpdate(
                    connection,
                    session.organizationId(),
                    reservationId);
            if (reservation == null) {
                throw new ClientErrorException("Réservation introuvable.", 404);
            }
            if (!reservation.reservedByMembershipId().equals(session.membershipId())) {
                throw new ClientErrorException(
                        "Seul le collègue qui a réservé peut annuler ce créneau.",
                        403);
            }
            if ("CANCELLED".equals(reservation.status())) {
                return new ActionResponse(
                        true,
                        "Cette réservation avait déjà été annulée.");
            }
            if (!"CONFIRMED".equals(reservation.status())) {
                throw new ClientErrorException(
                        "Cette réservation ne peut plus être annulée.",
                        409);
            }
            if (!reservation.startsAt().isAfter(Instant.now())) {
                throw new ClientErrorException(
                        "Une réservation commencée ne peut plus être annulée.",
                        409);
            }

            try (PreparedStatement statement = connection.prepareStatement("""
                    UPDATE reservation
                       SET status = 'CANCELLED'
                     WHERE organization_id = ?
                       AND id = ?
                       AND status = 'CONFIRMED'
                    """)) {
                statement.setObject(1, session.organizationId());
                statement.setObject(2, reservationId);
                if (statement.executeUpdate() != 1) {
                    throw new ClientErrorException(
                            "Cette réservation vient de changer. Actualisez la page.",
                            409);
                }
            }

            String ownerEmail = loadMembershipEmail(
                    connection,
                    reservation.ownerMembershipId());
            insertOutbox(
                    connection,
                    session.organizationId(),
                    "RESERVATION_CANCELLED",
                    "RESERVATION",
                    reservationId,
                    Map.of(
                            "email", ownerEmail,
                            "reserverName", session.displayName(),
                            "spot", reservation.spotLabel(),
                            "startsAt", reservation.startsAt().toString()));
            insertAudit(
                    connection,
                    session,
                    "RESERVATION_CANCELLED",
                    "RESERVATION",
                    reservationId);
            return new ActionResponse(
                    true,
                    "La réservation de la place "
                            + reservation.spotLabel()
                            + " est annulée. Le créneau est de nouveau disponible.");
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible d’annuler la réservation.", exception);
        }
    }

    @Transactional
    public ActionResponse withdrawAvailability(
            SessionContext session,
            String rawAvailabilityId) {
        UUID availabilityId = parseUuid(
                rawAvailabilityId,
                "Disponibilité introuvable.");

        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyTenant(connection, session.organizationId());
            WithdrawableOffer offer = loadWithdrawableOfferForUpdate(
                    connection,
                    session.organizationId(),
                    availabilityId);
            if (offer == null) {
                throw new ClientErrorException("Disponibilité introuvable.", 404);
            }
            if (!offer.ownerMembershipId().equals(session.membershipId())) {
                throw new ClientErrorException(
                        "Seul le titulaire qui a publié ce partage peut le retirer.",
                        403);
            }
            if ("WITHDRAWN".equals(offer.status())) {
                return new ActionResponse(
                        true,
                        "Cette disponibilité avait déjà été retirée.");
            }
            if (!"PUBLISHED".equals(offer.status())) {
                throw new ClientErrorException(
                        "Cette disponibilité ne peut plus être retirée.",
                        409);
            }
            if (hasActiveReservationForUpdate(connection, session.organizationId(), availabilityId)) {
                throw new ClientErrorException(
                        "Cette disponibilité est réservée. Le collègue doit d’abord annuler sa réservation.",
                        409);
            }

            try (PreparedStatement statement = connection.prepareStatement("""
                    UPDATE availability_offer
                       SET status = 'WITHDRAWN'
                     WHERE organization_id = ?
                       AND id = ?
                       AND status = 'PUBLISHED'
                    """)) {
                statement.setObject(1, session.organizationId());
                statement.setObject(2, availabilityId);
                if (statement.executeUpdate() != 1) {
                    throw new ClientErrorException(
                            "Cette disponibilité vient de changer. Actualisez la page.",
                            409);
                }
            }
            insertAudit(
                    connection,
                    session,
                    "AVAILABILITY_WITHDRAWN",
                    "AVAILABILITY_OFFER",
                    availabilityId);
            return new ActionResponse(
                    true,
                    "La disponibilité de la place "
                            + offer.spotLabel()
                            + " est retirée.");
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de retirer la disponibilité.", exception);
        }
    }

    @Transactional
    public ActionResponse invite(SessionContext session, InvitationRequest request) {
        String normalizedEmail = ProfessionalEmail.normalize(request.email());
        if (normalizedEmail.equals(session.normalizedEmail())) {
            throw new BadRequestException("Vous faites déjà partie de cet espace.");
        }
        String invitedDomain = ProfessionalEmail.domain(normalizedEmail);

        try (Connection connection = dataSource.getConnection()) {
            tenantContext.applyTenant(connection, session.organizationId());
            requireOrganizationDomain(connection, session.organizationId(), invitedDomain);
            enforceInvitationQuota(connection, session);
            UUID invitationId = findPendingInvitation(
                    connection,
                    session.organizationId(),
                    normalizedEmail);
            if (invitationId == null) {
                try (PreparedStatement statement = connection.prepareStatement("""
                        INSERT INTO invitation (
                            organization_id,
                            invited_by_membership_id,
                            normalized_email,
                            token_hash,
                            status,
                            expires_at
                        ) VALUES (?, ?, ?, ?, 'PENDING', now() + interval '7 days')
                        RETURNING id
                        """)) {
                    statement.setObject(1, session.organizationId());
                    statement.setObject(2, session.membershipId());
                    statement.setString(3, normalizedEmail);
                    statement.setString(4, tokens.hash(tokens.issue()));
                    try (ResultSet result = statement.executeQuery()) {
                        result.next();
                        invitationId = result.getObject("id", UUID.class);
                    }
                }
            }

            insertOutbox(
                    connection,
                    session.organizationId(),
                    "INVITATION_REQUESTED",
                    "INVITATION",
                    invitationId,
                    Map.of(
                            "email", normalizedEmail,
                            "inviterName", session.displayName(),
                            "organizationName", session.organizationName()));
            insertAudit(
                    connection,
                    session,
                    "INVITATION_REQUESTED",
                    "INVITATION",
                    invitationId);
            return new ActionResponse(
                    true,
                    "L’invitation a été mise en file pour "
                            + normalizedEmail
                            + ". Un e-mail lui sera envoyé.");
        } catch (SQLException exception) {
            throw new IllegalStateException("Impossible de créer l’invitation.", exception);
        }
    }

    private void requireOrganizationDomain(
            Connection connection,
            UUID organizationId,
            String normalizedDomain) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT 1
                  FROM organization_domain
                 WHERE organization_id = ?
                   AND normalized_domain = ?
                   AND status IN ('CLAIMED', 'VERIFIED')
                """)) {
            statement.setObject(1, organizationId);
            statement.setString(2, normalizedDomain);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw new BadRequestException(
                            "Invitez une adresse rattachée à un domaine de cette organisation.");
                }
            }
        }
    }

    private void enforceInvitationQuota(Connection connection, SessionContext session)
            throws SQLException {
        try (PreparedStatement lock = connection.prepareStatement(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))")) {
            lock.setString(1, "invitation-quota:" + session.membershipId());
            lock.executeQuery().close();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT count(*)
                  FROM audit_event
                 WHERE organization_id = ?
                   AND actor_membership_id = ?
                   AND action = 'INVITATION_REQUESTED'
                   AND result = 'SUCCESS'
                   AND occurred_at >= now() - interval '24 hours'
                """)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                if (result.getInt(1) >= invitationDailyLimit) {
                    throw new ClientErrorException(
                            "Le quota quotidien d’invitations est atteint.", 429);
                }
            }
        }
    }

    private void enforceActiveShareLimit(Connection connection, SessionContext session)
            throws SQLException {
        try (PreparedStatement lock = connection.prepareStatement(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))")) {
            lock.setString(1, "active-share-limit:" + session.membershipId());
            lock.executeQuery().close();
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT count(*)
                  FROM availability_offer
                 WHERE organization_id = ?
                   AND offered_by_membership_id = ?
                   AND status = 'PUBLISHED'
                   AND ends_at > now()
                """)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                if (result.getInt(1) >= activeShareLimit) {
                    throw new ClientErrorException(
                            "La limite de partages actifs est atteinte. Retirez un créneau avant d’en publier un autre.",
                            409);
                }
            }
        }
    }

    private AssignedSpot loadAssignedSpot(Connection connection, SessionContext session)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT spot.label,
                       COALESCE(spot.level_label, 'Niveau non renseigné') AS level,
                       site.timezone
                  FROM spot_assignment assignment
                  JOIN parking_spot spot
                    ON spot.organization_id = assignment.organization_id
                   AND spot.id = assignment.parking_spot_id
                  JOIN parking_site site
                    ON site.organization_id = spot.organization_id
                   AND site.id = spot.parking_site_id
                 WHERE assignment.organization_id = ?
                   AND assignment.membership_id = ?
                   AND assignment.status = 'ACTIVE'
                   AND assignment.starts_at <= now()
                   AND (assignment.ends_at IS NULL OR assignment.ends_at > now())
                 ORDER BY assignment.created_at DESC
                 LIMIT 1
                """)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new AssignedSpot(
                        result.getString("label"),
                        result.getString("level"),
                        safeZone(result.getString("timezone")).getId());
            }
        }
    }

    private AssignedSpotWithIds loadAssignedSpotForUpdate(
            Connection connection,
            SessionContext session) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT assignment.id AS assignment_id,
                       spot.id AS spot_id,
                       spot.label
                  FROM spot_assignment assignment
                  JOIN parking_spot spot
                    ON spot.organization_id = assignment.organization_id
                   AND spot.id = assignment.parking_spot_id
                 WHERE assignment.organization_id = ?
                   AND assignment.membership_id = ?
                   AND assignment.status = 'ACTIVE'
                   AND assignment.starts_at <= now()
                   AND (assignment.ends_at IS NULL OR assignment.ends_at > now())
                 ORDER BY assignment.created_at DESC
                 LIMIT 1
                 FOR UPDATE OF assignment
                """)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new AssignedSpotWithIds(
                        result.getObject("assignment_id", UUID.class),
                        result.getObject("spot_id", UUID.class),
                        result.getString("label"));
            }
        }
    }

    private ShareAssignment loadShareAssignment(Connection connection, SessionContext session)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT assignment.id AS assignment_id,
                       spot.id AS spot_id,
                       spot.label,
                       site.timezone
                  FROM spot_assignment assignment
                  JOIN parking_spot spot
                    ON spot.organization_id = assignment.organization_id
                   AND spot.id = assignment.parking_spot_id
                  JOIN parking_site site
                    ON site.organization_id = spot.organization_id
                   AND site.id = spot.parking_site_id
                 WHERE assignment.organization_id = ?
                   AND assignment.membership_id = ?
                   AND assignment.status = 'ACTIVE'
                   AND assignment.starts_at <= now()
                   AND (assignment.ends_at IS NULL OR assignment.ends_at > now())
                 ORDER BY assignment.created_at DESC
                 LIMIT 1
                """)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new ShareAssignment(
                        result.getObject("assignment_id", UUID.class),
                        result.getObject("spot_id", UUID.class),
                        result.getString("label"),
                        result.getString("timezone"));
            }
        }
    }

    private List<Availability> loadAvailability(
            Connection connection,
            SessionContext session) throws SQLException {
        String sql = """
                SELECT offer.id,
                       offer.offered_by_membership_id,
                       offer.starts_at,
                       offer.ends_at,
                       spot.label,
                       COALESCE(spot.level_label, 'Niveau non renseigné') AS level,
                       site.timezone,
                       reserved.id AS reservation_id,
                       reserved.reserved_by_membership_id
                  FROM availability_offer offer
                  JOIN parking_spot spot
                    ON spot.organization_id = offer.organization_id
                   AND spot.id = offer.parking_spot_id
                  JOIN parking_site site
                    ON site.organization_id = spot.organization_id
                   AND site.id = spot.parking_site_id
                  LEFT JOIN reservation reserved
                    ON reserved.organization_id = offer.organization_id
                   AND reserved.availability_offer_id = offer.id
                   AND reserved.status IN ('HELD', 'CONFIRMED')
                 WHERE offer.organization_id = ?
                   AND offer.status = 'PUBLISHED'
                   AND offer.ends_at > now()
                   AND offer.starts_at < now() + interval '7 days'
                 ORDER BY offer.starts_at, spot.label
                 LIMIT 50
                """;
        List<Availability> items = new ArrayList<>();
        Instant now = Instant.now();
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, session.organizationId());
            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    items.add(toAvailability(result, session, now));
                }
            }
        }
        return List.copyOf(items);
    }

    private List<Availability> loadActiveShares(
            Connection connection,
            SessionContext session) throws SQLException {
        String sql = """
                SELECT offer.id,
                       offer.offered_by_membership_id,
                       offer.starts_at,
                       offer.ends_at,
                       spot.label,
                       COALESCE(spot.level_label, 'Niveau non renseigné') AS level,
                       site.timezone,
                       reserved.id AS reservation_id,
                       reserved.reserved_by_membership_id
                  FROM availability_offer offer
                  JOIN parking_spot spot
                    ON spot.organization_id = offer.organization_id
                   AND spot.id = offer.parking_spot_id
                  JOIN parking_site site
                    ON site.organization_id = spot.organization_id
                   AND site.id = spot.parking_site_id
                  LEFT JOIN reservation reserved
                    ON reserved.organization_id = offer.organization_id
                   AND reserved.availability_offer_id = offer.id
                   AND reserved.status IN ('HELD', 'CONFIRMED')
                 WHERE offer.organization_id = ?
                   AND offer.offered_by_membership_id = ?
                   AND offer.status = 'PUBLISHED'
                   AND offer.ends_at > now()
                 ORDER BY offer.starts_at, spot.label
                 LIMIT ?
                """;
        List<Availability> items = new ArrayList<>();
        Instant now = Instant.now();
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            statement.setInt(3, activeShareLimit);
            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    items.add(toAvailability(result, session, now));
                }
            }
        }
        return List.copyOf(items);
    }

    private Availability toAvailability(
            ResultSet result,
            SessionContext session,
            Instant now) throws SQLException {
        Instant startsAt = result.getObject("starts_at", OffsetDateTime.class).toInstant();
        Instant endsAt = result.getObject("ends_at", OffsetDateTime.class).toInstant();
        ZoneId zone = safeZone(result.getString("timezone"));
        ZonedDateTime localStart = startsAt.atZone(zone);
        ZonedDateTime localEnd = endsAt.atZone(zone);
        UUID ownerMembershipId = result.getObject("offered_by_membership_id", UUID.class);
        UUID reservationId = result.getObject("reservation_id", UUID.class);
        UUID reservedByMembershipId =
                result.getObject("reserved_by_membership_id", UUID.class);
        boolean offeredByViewer = ownerMembershipId.equals(session.membershipId());
        boolean reservedByViewer = reservedByMembershipId != null
                && reservedByMembershipId.equals(session.membershipId());
        String status;
        if (reservationId != null) {
            status = "RESERVED";
        } else if (offeredByViewer) {
            status = "UNAVAILABLE";
        } else {
            status = "AVAILABLE";
        }
        String viewerRelation = offeredByViewer
                ? "OFFERED"
                : reservedByViewer ? "RESERVED" : "NONE";
        return new Availability(
                result.getObject("id", UUID.class).toString(),
                DATE_FORMATTER.format(localStart),
                TIME_FORMATTER.format(localStart) + " – " + TIME_FORMATTER.format(localEnd),
                zone.getId(),
                result.getString("label"),
                result.getString("level"),
                status,
                viewerRelation,
                reservedByViewer ? reservationId.toString() : null,
                reservedByViewer && startsAt.isAfter(now),
                offeredByViewer && reservationId == null);
    }

    private ReservationOffer loadReservationOffer(
            Connection connection,
            UUID organizationId,
            UUID availabilityId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT offer.parking_spot_id,
                       offer.offered_by_membership_id,
                       offer.starts_at,
                       offer.ends_at,
                       offer.status,
                       spot.label
                  FROM availability_offer offer
                  JOIN parking_spot spot
                    ON spot.organization_id = offer.organization_id
                   AND spot.id = offer.parking_spot_id
                 WHERE offer.organization_id = ?
                   AND offer.id = ?
                 FOR UPDATE OF offer
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, availabilityId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new ReservationOffer(
                        result.getObject("parking_spot_id", UUID.class),
                        result.getObject("offered_by_membership_id", UUID.class),
                        result.getObject("starts_at", OffsetDateTime.class).toInstant(),
                        result.getObject("ends_at", OffsetDateTime.class).toInstant(),
                        result.getString("status"),
                        result.getString("label"));
            }
        }
    }

    private CancellableReservation loadCancellableReservationForUpdate(
            Connection connection,
            UUID organizationId,
            UUID reservationId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT reserved.reserved_by_membership_id,
                       reserved.starts_at,
                       reserved.status,
                       offer.offered_by_membership_id,
                       spot.label
                  FROM reservation reserved
                  JOIN availability_offer offer
                    ON offer.organization_id = reserved.organization_id
                   AND offer.id = reserved.availability_offer_id
                  JOIN parking_spot spot
                    ON spot.organization_id = reserved.organization_id
                   AND spot.id = reserved.parking_spot_id
                 WHERE reserved.organization_id = ?
                   AND reserved.id = ?
                 FOR UPDATE OF offer, reserved
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, reservationId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new CancellableReservation(
                        result.getObject("reserved_by_membership_id", UUID.class),
                        result.getObject("offered_by_membership_id", UUID.class),
                        result.getObject("starts_at", OffsetDateTime.class).toInstant(),
                        result.getString("status"),
                        result.getString("label"));
            }
        }
    }

    private WithdrawableOffer loadWithdrawableOfferForUpdate(
            Connection connection,
            UUID organizationId,
            UUID availabilityId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT offer.offered_by_membership_id,
                       offer.status,
                       spot.label
                  FROM availability_offer offer
                  JOIN parking_spot spot
                    ON spot.organization_id = offer.organization_id
                   AND spot.id = offer.parking_spot_id
                 WHERE offer.organization_id = ?
                   AND offer.id = ?
                 FOR UPDATE OF offer
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, availabilityId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new WithdrawableOffer(
                        result.getObject("offered_by_membership_id", UUID.class),
                        result.getString("status"),
                        result.getString("label"));
            }
        }
    }

    private boolean hasActiveReservationForUpdate(
            Connection connection,
            UUID organizationId,
            UUID availabilityId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT 1
                  FROM reservation
                 WHERE organization_id = ?
                   AND availability_offer_id = ?
                   AND status IN ('HELD', 'CONFIRMED')
                 LIMIT 1
                 FOR UPDATE
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, availabilityId);
            try (ResultSet result = statement.executeQuery()) {
                return result.next();
            }
        }
    }

    private UUID loadReservationAvailabilityForKey(
            Connection connection,
            SessionContext session,
            String idempotencyKey) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT availability_offer_id
                  FROM reservation
                 WHERE organization_id = ?
                   AND reserved_by_membership_id = ?
                   AND idempotency_key = ?
                 LIMIT 1
                """)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            statement.setString(3, idempotencyKey);
            try (ResultSet result = statement.executeQuery()) {
                return result.next()
                        ? result.getObject("availability_offer_id", UUID.class)
                        : null;
            }
        }
    }

    private UUID findPendingInvitation(
            Connection connection,
            UUID organizationId,
            String normalizedEmail) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT id
                  FROM invitation
                 WHERE organization_id = ?
                   AND normalized_email = ?
                   AND status = 'PENDING'
                   AND expires_at > now()
                 ORDER BY created_at DESC
                 LIMIT 1
                 FOR UPDATE
                """)) {
            statement.setObject(1, organizationId);
            statement.setString(2, normalizedEmail);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? result.getObject("id", UUID.class) : null;
            }
        }
    }

    private UUID loadPrimarySite(Connection connection, UUID organizationId)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT id
                  FROM parking_site
                 WHERE organization_id = ?
                   AND status = 'ACTIVE'
                 ORDER BY created_at
                 LIMIT 1
                """)) {
            statement.setObject(1, organizationId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw new IllegalStateException("Aucun parking actif pour cette organisation.");
                }
                return result.getObject("id", UUID.class);
            }
        }
    }

    private UUID findOrCreateSpot(
            Connection connection,
            UUID organizationId,
            UUID siteId,
            String label,
            String level) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO parking_spot (
                    organization_id,
                    parking_site_id,
                    label,
                    level_label
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT (organization_id, parking_site_id, label)
                DO UPDATE SET level_label = COALESCE(EXCLUDED.level_label, parking_spot.level_label)
                RETURNING id
                """)) {
            statement.setObject(1, organizationId);
            statement.setObject(2, siteId);
            statement.setString(3, label);
            statement.setString(4, level);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getObject("id", UUID.class);
            }
        }
    }

    private void updateSpotLevel(Connection connection, UUID spotId, String level)
            throws SQLException {
        if (level == null) {
            return;
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE parking_spot
                   SET level_label = ?
                 WHERE id = ?
                """)) {
            statement.setString(1, level);
            statement.setObject(2, spotId);
            statement.executeUpdate();
        }
    }

    private String loadMembershipEmail(Connection connection, UUID membershipId)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT email.normalized_email
                  FROM membership member
                  JOIN user_email email
                    ON email.user_account_id = member.user_account_id
                   AND email.email_type = 'PROFESSIONAL'
                 WHERE member.id = ?
                 ORDER BY email.created_at
                 LIMIT 1
                """)) {
            statement.setObject(1, membershipId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw new IllegalStateException("Destinataire de notification introuvable.");
                }
                return result.getString("normalized_email");
            }
        }
    }

    private int count(Connection connection, String sql, Object... parameters)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            for (int index = 0; index < parameters.length; index += 1) {
                statement.setObject(index + 1, parameters[index]);
            }
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        }
    }

    private void insertOutbox(
            Connection connection,
            UUID organizationId,
            String eventType,
            String aggregateType,
            UUID aggregateId,
            Map<String, String> payload) throws SQLException {
        UUID eventId;
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO outbox_event (
                    organization_id,
                    event_type,
                    aggregate_type,
                    aggregate_id,
                    payload
                ) VALUES (?, ?, ?, ?, CAST(? AS jsonb))
                RETURNING id
                """)) {
            statement.setObject(1, organizationId);
            statement.setString(2, eventType);
            statement.setString(3, aggregateType);
            statement.setObject(4, aggregateId);
            try {
                statement.setString(5, objectMapper.writeValueAsString(payload));
            } catch (JsonProcessingException exception) {
                throw new IllegalStateException("Payload de notification invalide.", exception);
            }
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                eventId = result.getObject("id", UUID.class);
            }
        }
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO outbox_dispatch (
                    event_id,
                    organization_id,
                    aggregate_type,
                    aggregate_id
                ) VALUES (?, ?, ?, ?)
                """)) {
            statement.setObject(1, eventId);
            statement.setObject(2, organizationId);
            statement.setString(3, aggregateType);
            statement.setObject(4, aggregateId);
            statement.executeUpdate();
        }
    }

    private void insertAudit(
            Connection connection,
            SessionContext session,
            String action,
            String targetType,
            UUID targetId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO audit_event (
                    organization_id,
                    actor_membership_id,
                    action,
                    target_type,
                    target_id,
                    result
                ) VALUES (?, ?, ?, ?, ?, 'SUCCESS')
                """)) {
            statement.setObject(1, session.organizationId());
            statement.setObject(2, session.membershipId());
            statement.setString(3, action);
            statement.setString(4, targetType);
            statement.setObject(5, targetId);
            statement.executeUpdate();
        }
    }

    private static TimeWindow parseTimeWindow(ShareRequest request, String timezone) {
        try {
            LocalDate date = LocalDate.parse(request.date());
            LocalTime from = LocalTime.parse(request.from());
            LocalTime to = LocalTime.parse(request.to());
            if (!from.isBefore(to)) {
                throw new BadRequestException(
                        "L’heure de fin doit être postérieure à l’heure de début.");
            }
            ZoneId zone = safeZone(timezone);
            Instant startsAt = date.atTime(from).atZone(zone).toInstant();
            Instant endsAt = date.atTime(to).atZone(zone).toInstant();
            Instant now = Instant.now();
            if (!endsAt.isAfter(now)) {
                throw new BadRequestException("Le créneau doit se terminer dans le futur.");
            }
            if (startsAt.isAfter(now.plusSeconds(366L * 24 * 60 * 60))) {
                throw new BadRequestException(
                        "Une disponibilité ne peut pas être publiée plus d’un an à l’avance.");
            }
            return new TimeWindow(startsAt, endsAt);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("La date ou le créneau horaire est invalide.");
        }
    }

    private static ZoneId safeZone(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException exception) {
            return ZoneId.of("Europe/Paris");
        }
    }

    private static String normalizeSpotLabel(String rawLabel) {
        String label = rawLabel == null
                ? ""
                : rawLabel.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "-");
        if (label.isBlank() || label.length() > 32 || !label.matches("[A-Z0-9][A-Z0-9._-]*")) {
            throw new BadRequestException(
                    "Le libellé de place doit contenir lettres, chiffres, point, tiret ou underscore.");
        }
        return label;
    }

    private static String normalizeLevel(String rawLevel) {
        if (rawLevel == null || rawLevel.isBlank()) {
            return null;
        }
        String level = rawLevel.trim().replaceAll("\\s+", " ");
        if (level.length() > 64) {
            throw new BadRequestException("Le niveau est limité à 64 caractères.");
        }
        return level;
    }

    private static UUID parseUuid(String rawValue, String message) {
        try {
            return UUID.fromString(rawValue);
        } catch (IllegalArgumentException exception) {
            throw new ClientErrorException(message, 404);
        }
    }

    private static void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null
                || idempotencyKey.length() < 8
                || idempotencyKey.length() > 128) {
            throw new BadRequestException(
                    "L’en-tête Idempotency-Key doit contenir entre 8 et 128 caractères.");
        }
    }

    private static boolean isConflict(SQLException exception) {
        return "23P01".equals(exception.getSQLState())
                || "23505".equals(exception.getSQLState());
    }

    private static String firstName(String displayName) {
        int separator = displayName.indexOf(' ');
        return separator > 0 ? displayName.substring(0, separator) : displayName;
    }

    private static String initials(String displayName) {
        String[] words = displayName.trim().split("\\s+");
        StringBuilder value = new StringBuilder();
        for (String word : words) {
            if (!word.isBlank() && value.length() < 2) {
                value.append(word.substring(0, 1).toUpperCase(Locale.FRENCH));
            }
        }
        return value.isEmpty() ? "PV" : value.toString();
    }

    private record AssignedSpot(String label, String level, String timeZone) {
    }

    private record AssignedSpotWithIds(UUID assignmentId, UUID spotId, String label) {
    }

    private record ShareAssignment(
            UUID assignmentId,
            UUID spotId,
            String label,
            String timezone) {
    }

    private record ReservationOffer(
            UUID spotId,
            UUID ownerMembershipId,
            Instant startsAt,
            Instant endsAt,
            String status,
            String spotLabel) {
    }

    private record CancellableReservation(
            UUID reservedByMembershipId,
            UUID ownerMembershipId,
            Instant startsAt,
            String status,
            String spotLabel) {
    }

    private record WithdrawableOffer(
            UUID ownerMembershipId,
            String status,
            String spotLabel) {
    }

    private record TimeWindow(Instant startsAt, Instant endsAt) {
    }
}
