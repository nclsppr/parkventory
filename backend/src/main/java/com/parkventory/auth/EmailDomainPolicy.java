package com.parkventory.auth;

import jakarta.ws.rs.BadRequestException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

final class EmailDomainPolicy {
    private static final String RESOURCE = "/email-domain-policy.txt";
    private static final Map<String, Classification> CLASSIFICATIONS = load();

    private EmailDomainPolicy() {
    }

    static void requireProfessional(String domain) {
        Classification classification = classify(domain);
        if (classification == Classification.PROFESSIONAL) {
            return;
        }
        throw new BadRequestException(switch (classification) {
            case DISPOSABLE -> "Les adresses e-mail temporaires ne sont pas acceptées.";
            case PERSONAL, SHARED -> "Une adresse e-mail professionnelle est requise.";
            case PROFESSIONAL -> throw new IllegalStateException("Classification incohérente.");
        });
    }

    static Classification classify(String domain) {
        String candidate = domain.toLowerCase(Locale.ROOT);
        boolean exact = true;
        while (true) {
            Classification classification = CLASSIFICATIONS.get(candidate);
            if (classification != null
                    && (exact || classification != Classification.SHARED)) {
                return classification;
            }
            int separator = candidate.indexOf('.');
            if (separator < 0) {
                return Classification.PROFESSIONAL;
            }
            candidate = candidate.substring(separator + 1);
            exact = false;
        }
    }

    private static Map<String, Classification> load() {
        InputStream stream = EmailDomainPolicy.class.getResourceAsStream(RESOURCE);
        if (stream == null) {
            throw new ExceptionInInitializerError("Politique de domaines e-mail absente.");
        }

        Map<String, Classification> entries = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;
            while ((line = reader.readLine()) != null) {
                lineNumber += 1;
                String candidate = line.strip();
                if (candidate.isEmpty() || candidate.startsWith("#")) {
                    continue;
                }
                String[] parts = candidate.split("\\s+", 2);
                if (parts.length != 2) {
                    throw invalidPolicy(lineNumber);
                }
                Classification classification;
                try {
                    classification = Classification.valueOf(parts[0]);
                } catch (IllegalArgumentException exception) {
                    throw invalidPolicy(lineNumber);
                }
                String domain = parts[1].toLowerCase(Locale.ROOT);
                if (!domain.matches("[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?")) {
                    throw invalidPolicy(lineNumber);
                }
                Classification previous = entries.putIfAbsent(domain, classification);
                if (previous != null) {
                    throw invalidPolicy(lineNumber);
                }
            }
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
        if (entries.isEmpty()) {
            throw new ExceptionInInitializerError("Politique de domaines e-mail vide.");
        }
        return Collections.unmodifiableMap(entries);
    }

    private static ExceptionInInitializerError invalidPolicy(int lineNumber) {
        return new ExceptionInInitializerError(
                "Politique de domaines e-mail invalide à la ligne " + lineNumber + ".");
    }

    enum Classification {
        PROFESSIONAL,
        PERSONAL,
        DISPOSABLE,
        SHARED
    }
}
