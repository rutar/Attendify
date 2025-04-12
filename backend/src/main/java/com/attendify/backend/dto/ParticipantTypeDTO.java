package com.attendify.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Schema(description = "Data Transfer Object to specify the type of participant.")
public class ParticipantTypeDTO {
    @NotBlank(message = "Participant type cannot be empty")
    @Schema(description = "Type of participant.", example = "PERSON", required = true, allowableValues = {"PERSON", "COMPANY"})
    private String type;
}