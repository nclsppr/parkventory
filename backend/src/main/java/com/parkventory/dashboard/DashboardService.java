package com.parkventory.dashboard;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import static com.parkventory.dashboard.ApiModels.*;

@ApplicationScoped
public class DashboardService {
    private static final Set<String> PERSONAL_DOMAINS = Set.of(
            "gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com");

    private final List<Availability> availability = new ArrayList<>(List.of(
            new Availability("availability-a24-thu", "Jeu. 30 juillet", "08:00 – 18:00", "A-24", "Niveau A", "AVAILABLE"),
            new Availability("availability-b18-fri", "Ven. 31 juillet", "09:00 – 17:00", "B-18", "Niveau B", "AVAILABLE"),
            new Availability("availability-c07-mon", "Lun. 3 août", "12:00 – 16:00", "C-07", "Niveau C", "AVAILABLE"),
            new Availability("availability-d12-tue", "Mar. 4 août", "08:30 – 18:00", "D-12", "Niveau D", "AVAILABLE"),
            new Availability("availability-e03-wed", "Mer. 5 août", "10:00 – 14:00", "E-03", "Niveau E", "AVAILABLE")));

    private final List<Thanks> thanks = List.of(
            new Thanks("thanks-julie", "JL", "Julie L.", "Merci Nicolas, ta place m’a bien dépannée !", "Aujourd’hui"),
            new Thanks("thanks-alexis", "AM", "Alexis M.", "Super partage ce matin, merci encore.", "Hier"),
            new Thanks("thanks-sophie", "SR", "Sophie R.", "Au top, comme d’habitude. Merci !", "Il y a 2 j"));

    private int sharedTotal = 1300;
    private int shares = 12;
    private int reservations = 9;
    private int availableSpots = 27;

    public synchronized Dashboard dashboard() {
        return new Dashboard(
                true,
                new User("Nicolas", "Nicolas D.", "ND", "A-24"),
                new Organization("Victor Buck Services", sharedTotal),
                new Stats(shares, reservations, availableSpots),
                List.copyOf(availability),
                thanks);
    }

    public synchronized ActionResponse share(ShareRequest request) {
        try {
            LocalTime from = LocalTime.parse(request.from());
            LocalTime to = LocalTime.parse(request.to());
            if (!from.isBefore(to)) {
                throw new BadRequestException("L’heure de fin doit être postérieure à l’heure de début.");
            }
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Le créneau horaire est invalide.", exception);
        }

        shares += 1;
        sharedTotal += 1;
        availableSpots += 1;
        return new ActionResponse(true, "La place " + request.spot() + " est partagée dans cette démo locale.");
    }

    public synchronized ActionResponse reserve(String availabilityId) {
        for (int index = 0; index < availability.size(); index += 1) {
            Availability item = availability.get(index);
            if (!item.id().equals(availabilityId)) {
                continue;
            }
            if (!"AVAILABLE".equals(item.status())) {
                throw new ClientErrorException("Cette place est déjà réservée.", 409);
            }
            availability.set(index, item.withStatus("RESERVED"));
            reservations += 1;
            availableSpots = Math.max(0, availableSpots - 1);
            return new ActionResponse(true, "La place " + item.spot() + " est réservée dans cette démo locale.");
        }
        throw new ClientErrorException("Disponibilité introuvable.", 404);
    }

    public ActionResponse invite(InvitationRequest request) {
        String normalized = request.email().trim().toLowerCase(Locale.ROOT);
        int at = normalized.lastIndexOf('@');
        if (at < 1 || PERSONAL_DOMAINS.contains(normalized.substring(at + 1))) {
            throw new BadRequestException("Une adresse professionnelle est requise.");
        }
        return new ActionResponse(true, "Une invitation de démonstration a été préparée pour " + normalized + ".");
    }
}
