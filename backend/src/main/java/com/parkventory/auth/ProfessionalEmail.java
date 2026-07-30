package com.parkventory.auth;

import jakarta.ws.rs.BadRequestException;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class ProfessionalEmail {
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]{1,64}@[^@\\s]{1,190}$");
    private static final Set<String> PERSONAL_DOMAINS = Set.of(
            "gmail.com",
            "googlemail.com",
            "outlook.com",
            "hotmail.com",
            "live.com",
            "yahoo.com",
            "icloud.com",
            "proton.me",
            "protonmail.com");

    private ProfessionalEmail() {
    }

    public static String normalize(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new BadRequestException("Saisissez une adresse e-mail professionnelle valide.");
        }
        if (PERSONAL_DOMAINS.contains(domain(normalized))) {
            throw new BadRequestException("Une adresse e-mail professionnelle est requise.");
        }
        return normalized;
    }

    public static String domain(String normalizedEmail) {
        return normalizedEmail.substring(normalizedEmail.lastIndexOf('@') + 1);
    }
}
