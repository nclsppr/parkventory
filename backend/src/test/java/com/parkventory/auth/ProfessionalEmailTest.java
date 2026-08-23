package com.parkventory.auth;

import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfessionalEmailTest {
    @Test
    void acceptsUnlistedCompanyDomainsWithoutAnAllowlist() {
        assertEquals(
                "personne@atelier-exemple.fr",
                ProfessionalEmail.normalize(" Personne@Atelier-Exemple.fr "));
        assertEquals(
                "personne@entreprise.co.uk",
                ProfessionalEmail.normalize("personne@entreprise.co.uk"));
    }

    @Test
    void rejectsSharedPersonalDisposableAndPublicNamespaceDomains() {
        assertThrows(
                BadRequestException.class,
                () -> ProfessionalEmail.normalize("personne@gmail.com"));
        assertThrows(
                BadRequestException.class,
                () -> ProfessionalEmail.normalize("personne@mail.gmail.com"));
        assertThrows(
                BadRequestException.class,
                () -> ProfessionalEmail.normalize("personne@mailinator.com"));
        assertThrows(
                BadRequestException.class,
                () -> ProfessionalEmail.normalize("personne@co.uk"));
    }

    @Test
    void rejectsDomainsThatCannotSafelyIdentifyACommunity() {
        assertThrows(
                BadRequestException.class,
                () -> ProfessionalEmail.normalize("personne@localhost"));
        assertThrows(
                BadRequestException.class,
                () -> ProfessionalEmail.normalize("personne@-entreprise.fr"));
        assertThrows(
                BadRequestException.class,
                () -> ProfessionalEmail.normalize("personne@entreprise..fr"));
    }
}
