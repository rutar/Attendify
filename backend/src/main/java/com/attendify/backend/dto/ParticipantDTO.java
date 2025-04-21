package com.attendify.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Schema(description = "Data Transfer Object for a participant, representing either a person or a company.")
public class ParticipantDTO {
    @Schema(description = "Unique identifier of the participant.", example = "1")
    private Long id;

    @Schema(description = "Type of participant.", example = "PERSON", allowableValues = {"PERSON", "COMPANY"})
    private String type;

    // Person
    @Schema(description = "First name of the person (applicable if type is PERSON).", example = "John")
    private String firstName;

    @Schema(description = "Last name of the person (applicable if type is PERSON).", example = "Doe")
    private String lastName;

    @Schema(description = "Personal code of the person (applicable if type is PERSON).", example = "39005270891")
    private String personalCode;

    // Company
    @Schema(description = "Name of the company (applicable if type is COMPANY).", example = "Tech Corp")
    private String companyName;

    @Schema(description = "Registration code of the company (applicable if type is COMPANY).", example = "12345678")
    private String registrationCode;

    @Schema(description = "Number of participants from the company (applicable if type is COMPANY).", example = "5")
    private Integer participantCount;

    @Schema(description = "Contact person for the company (applicable if type is COMPANY).", example = "Jane Smith")
    private String contactPerson;

    // Common
    @Schema(description = "Payment method chosen by the participant.", example = "BANK_TRANSFER", allowableValues = {"BANK_TRANSFER", "CASH", "CARD"})
    private String paymentMethod;

    @Schema(description = "Additional information provided by the participant.", example = "Special dietary needs")
    private String additionalInfo;

    @Schema(description = "Email address of the participant.", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Phone number of the participant.", example = "+37212345678")
    private String phone;
}