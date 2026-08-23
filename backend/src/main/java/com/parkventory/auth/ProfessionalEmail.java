package com.parkventory.auth;

import jakarta.ws.rs.BadRequestException;

import java.net.IDN;
import java.util.Locale;
import java.util.regex.Pattern;

public final class ProfessionalEmail {
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]{1,64}@[^@\\s]{1,190}$");

    private ProfessionalEmail() {
    }

    public static String normalize(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new BadRequestException("Saisissez une adresse e-mail professionnelle valide.");
        }
        int separator = normalized.lastIndexOf('@');
        String asciiDomain;
        try {
            asciiDomain = IDN.toASCII(
                    normalized.substring(separator + 1),
                    IDN.USE_STD3_ASCII_RULES).toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Saisissez une adresse e-mail professionnelle valide.");
        }
        if (asciiDomain.length() > 253
                || !asciiDomain.contains(".")
                || asciiDomain.contains("..")
                || asciiDomain.startsWith(".")
                || asciiDomain.endsWith(".")) {
            throw new BadRequestException("Saisissez une adresse e-mail professionnelle valide.");
        }
        EmailDomainPolicy.requireProfessional(asciiDomain);
        return normalized.substring(0, separator + 1) + asciiDomain;
    }

    public static String domain(String normalizedEmail) {
        return normalizedEmail.substring(normalizedEmail.lastIndexOf('@') + 1);
    }
}
