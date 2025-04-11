package com.attendify.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ParticipantTypeDTO {
    @NotBlank(message = "Participant type cannot be empty")
    private String type; // "PERSON" or "COMPANY"
}
