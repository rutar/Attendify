package com.attendify.backend.dto;

import com.attendify.backend.domain.Event;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@Schema(description = "Data Transfer Object for an event, containing details like name, date, and location.")
public class EventDTO {
    @Schema(description = "Unique identifier of the event.", example = "1")
    private Long id;

    @NotBlank(message = "Event name cannot be empty")
    @Schema(description = "Name of the event.", example = "Tech Conference 2025", required = true)
    private String name;

    @NotNull(message = "Event date/time cannot be empty")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @Schema(description = "Date and time of the event (in UTC).", example = "2025-06-01T09:00:00Z", required = true)
    private Instant dateTime;

    @NotBlank(message = "Event location cannot be empty")
    @Schema(description = "Location where the event will take place.", example = "Tallinn Convention Center", required = true)
    private String location;

    @Schema(description = "Status of event.", example = "ACTIVE", allowableValues = {"ACTIVE", "CANCELLED"})
    private Event.EventStatus status;

    @Schema(description = "Additional information about the event.", example = "Keynote by industry leaders")
    private String additionalInfo;

    @Schema(description = "Total number of registered participants.", example = "150")
    private int participantCount;
}