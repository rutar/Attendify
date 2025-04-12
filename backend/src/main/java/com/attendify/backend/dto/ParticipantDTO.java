package com.attendify.backend.dto;

import com.attendify.backend.domain.EventParticipant;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@Schema(description = "Data Transfer Object for a participant, representing either a person or a company.")
public class ParticipantDTO {
    @Schema(description = "Unique identifier of the participant.", example = "1")
    private Long id;

    @Schema(description = "Type of participant.", example = "PERSON", allowableValues = {"PERSON", "COMPANY"})
    private String type;

    @Schema(description = "Name of the participant (full name for person, company name for company).", example = "John Doe")
    private String name;

    @Schema(description = "Code identifying the participant (personal code for person, registration code for company).", example = "39005270891")
    private String code;

    @Schema(description = "Payment method chosen by the participant.", example = "BANK_TRANSFER", allowableValues = {"BANK_TRANSFER", "CASH", "CARD"})
    private Object paymentMethod;

    @Schema(description = "Additional information provided by the participant.", example = "Special dietary needs")
    private String additionalInfo;

    @Schema(description = "Email address of the participant.", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Phone number of the participant.", example = "+37212345678")
    private String phone;

    @Schema(description = "Number of participants (relevant for companies).", example = "5")
    private Integer participantCount;

    @Schema(description = "Contact person for the company (if applicable).", example = "Jane Smith")
    private String contactPerson;
}