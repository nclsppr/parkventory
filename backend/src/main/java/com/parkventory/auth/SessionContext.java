package com.parkventory.auth;

import java.util.UUID;

public record SessionContext(
        UUID userId,
        UUID membershipId,
        UUID organizationId,
        String displayName,
        String normalizedEmail,
        String organizationName,
        String role) {
}
