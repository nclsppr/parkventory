package com.parkventory.notifications;

import com.parkventory.auth.AuthService;
import io.quarkus.arc.profile.UnlessBuildProfile;
import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.SQLException;

@ApplicationScoped
@UnlessBuildProfile("prod")
public class LocalInvitationAccessMailer implements InvitationAccessMailer {
    private final AuthService authService;

    public LocalInvitationAccessMailer(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void send(
            Connection connection,
            String normalizedEmail,
            String inviterName,
            String organizationName) throws SQLException {
        authService.sendInvitationMagicLink(connection, normalizedEmail);
    }
}
