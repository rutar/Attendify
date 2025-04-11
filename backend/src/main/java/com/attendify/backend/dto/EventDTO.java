package com.attendify.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class EventDTO {
    private Long id;

    @NotBlank(message = "Event name cannot be empty")
    private String name;

    @NotNull(message = "Event date/time cannot be empty")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime eventDateTime;

    @NotBlank(message = "Event location cannot be empty")
    private String location;

    private String additionalInfo;

    private int participantCount;
}

