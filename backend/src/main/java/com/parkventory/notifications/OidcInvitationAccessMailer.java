package com.parkventory.notifications;

import io.quarkus.arc.profile.IfBuildProfile;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.sql.Connection;

@ApplicationScoped
@IfBuildProfile("prod")
public class OidcInvitationAccessMailer implements InvitationAccessMailer {
    private final Mailer mailer;
    private final String oidcLoginUrl;

    public OidcInvitationAccessMailer(
            Mailer mailer,
            @ConfigProperty(name = "parkventory.web.base-url") String webBaseUrl) {
        this.mailer = mailer;
        this.oidcLoginUrl = webBaseUrl.replaceAll("/+$", "") + "/api/v1/auth/oidc/login";
    }

    @Override
    public void send(
            Connection connection,
            String normalizedEmail,
            String inviterName,
            String organizationName) {
        mailer.send(Mail.withText(
                normalizedEmail,
                "Votre invitation Parkventory",
                """
                        %s vous invite à rejoindre %s sur Parkventory.

                        Continuez avec cette adresse professionnelle :
                        %s

                        Un code à usage unique vous sera demandé. Si vous n’attendiez pas cette invitation, ignorez cet e-mail.
                        """.formatted(inviterName, organizationName, oidcLoginUrl)));
    }
}
