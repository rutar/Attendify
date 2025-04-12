package com.attendify.backend.dto;

import com.attendify.backend.domain.EventParticipant;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@Schema(description = "Data Transfer Object representing a participant's registration to an event.")
public class EventParticipantDTO {
    @Schema(description = "Details of the participant.")
    private ParticipantDTO participant;

    @Schema(description = "Attendance status of the participant.", example = "REGISTERED", allowableValues = {"REGISTERED", "ATTENDED", "CANCELLED"})
    private EventParticipant.AttendanceStatus attendanceStatus;

    @Schema(description = "Timestamp when the participant registered for the event.", example = "2025-04-12T10:00:00Z")
    private Instant registeredAt;
}