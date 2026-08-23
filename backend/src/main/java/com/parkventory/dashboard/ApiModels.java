package com.parkventory.dashboard;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ApiModels {
    private ApiModels() {
    }

    public record User(
            String firstName,
            String fullName,
            String initials,
            String assignedSpot,
            String assignedLevel) {
    }

    public record Organization(String name, int sharedTotal) {
    }

    public record Stats(int shares, int reservations, int availableSpots) {
    }

    public record Availability(
            String id,
            String dateLabel,
            String timeLabel,
            String spot,
            String level,
            String status,
            String viewerRelation,
            String reservationId,
            boolean canCancel,
            boolean canWithdraw) {
    }

    public record Thanks(String id, String initials, String author, String message, String when) {
    }

    public record Dashboard(
            boolean demo,
            User user,
            Organization organization,
            Stats stats,
            List<Availability> availability,
            List<Thanks> thanks) {
    }

    public record SpotRequest(
            @NotBlank @Size(max = 32) String label,
            @Size(max = 64) String level) {
    }

    public record ShareRequest(
            @NotBlank @Size(max = 32) String spot,
            @NotBlank String date,
            @NotBlank String from,
            @NotBlank String to) {
    }

    public record InvitationRequest(@NotBlank @Email String email) {
    }

    public record ActionResponse(boolean accepted, String message) {
    }
}
