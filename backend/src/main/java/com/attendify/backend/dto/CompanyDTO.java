package com.attendify.backend.dto;

import com.attendify.backend.domain.Participant;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Schema(description = "Data Transfer Object for a company participant, containing company details and payment information.")
public class CompanyDTO {
    @Schema(description = "Unique identifier of the company.", example = "1")
    private Long id;

    @NotBlank(message = "Company name cannot be empty")
    @Schema(description = "Name of the company.", example = "TechCorp OÜ", required = true)
    private String companyName;

    @Pattern(regexp = "^\\d{8}$", message = "Registration code must be an 8-digit Estonian code")
    @Schema(description = "Estonian company registration code, 8 digits.", example = "12345678", required = true)
    private String registrationCode;

    @Min(value = 1, message = "Participant count must be at least 1")
    @Schema(description = "Number of participants from the company.", example = "5", required = true)
    private Integer participantCount;

    @NotNull(message = "Payment method cannot be empty")
    @Schema(description = "Payment method chosen by the company.", example = "BANK_TRANSFER", required = true, allowableValues = {"BANK_TRANSFER", "CASH", "CARD"})
    private Participant.PaymentMethod paymentMethod;

    @Schema(description = "Additional information provided by the company.", example = "Sponsoring the event")
    private String additionalInfo;
}