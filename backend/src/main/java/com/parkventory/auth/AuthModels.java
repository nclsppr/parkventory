package com.parkventory.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class AuthModels {
    private AuthModels() {
    }

    public record MagicLinkRequest(@NotBlank @Email String email) {
    }

    public record MagicLinkVerification(@NotBlank String token) {
    }

    public record AuthAction(boolean accepted, String message) {
    }

    public record SessionView(
            boolean authenticated,
            String displayName,
            String email,
            String organizationName,
            String role) {
    }
}
