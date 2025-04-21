package com.attendify.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Getter
@Setter
public class EventDTO {

    @Schema(description = "Unique identifier of the event", example = "1")
    private Long id;

    @NotBlank(message = "Event name cannot be empty")
    @Schema(description = "Name of the event", example = "Tech Conference 2025")
    private String name;

    @NotNull(message = "Event date and time cannot be null")
    @Schema(
            description = "Date and time of the event in ISO-8601 UTC format",
            example = "2025-06-01T09:00:00Z",
            pattern = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z"
    )
    private Instant dateTime;

    @Schema(description = "Location of the event", example = "Tallinn Conference Center")
    private String location;

    @NotBlank(message = "Event status cannot be empty")
    @Schema(description = "Status of the event", example = "ACTIVE")
    private String status;

    @Schema(description = "Additional information about the event", example = "Leading tech experts speaking")
    private String additionalInfo;

    @Schema(description = "Creation timestamp of the event", example = "2025-01-01T10:00:00Z")
    private OffsetDateTime createdAt;

    @Schema(description = "Last update timestamp of the event", example = "2025-01-01T10:00:00Z")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.from(LocalDateTime.now());
        updatedAt = OffsetDateTime.from(LocalDateTime.now());
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.from(LocalDateTime.now());
    }
}



