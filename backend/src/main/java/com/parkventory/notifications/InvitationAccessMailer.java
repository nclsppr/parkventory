package com.parkventory.notifications;

import java.sql.Connection;
import java.sql.SQLException;

public interface InvitationAccessMailer {
    void send(
            Connection connection,
            String normalizedEmail,
            String inviterName,
            String organizationName) throws SQLException;
}
