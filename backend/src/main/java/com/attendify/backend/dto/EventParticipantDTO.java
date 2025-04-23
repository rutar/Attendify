package com.attendify.backend.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@Schema(description = "DTO representing the association between an event and a participant.")
public class EventParticipantDTO {

    @Schema(description = "Unique identifier of the event.", example = "1001")
    private Long eventId;

    @Schema(description = "Unique identifier of the participant.", example = "2002")
    private Long participantId;

    @Schema(
            description = "Current status of the participant's attendance.",
            example = "REGISTERED",
            allowableValues = {"REGISTERED", "ATTENDED", "CANCELLED"}
    )
    private String attendanceStatus;

    @Schema(description = "Timestamp of when the participant was registered for the event.", example = "2025-04-10T14:30:00Z")
    private Instant registeredAt;
}
