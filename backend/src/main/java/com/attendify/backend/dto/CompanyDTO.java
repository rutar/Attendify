package com.attendify.backend.dto;

import com.attendify.backend.domain.Participant;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CompanyDTO {
    private Long id;

    @NotBlank(message = "Company name cannot be empty")
    private String companyName;

    @Pattern(regexp = "^\\d{8}$", message = "Registration code must be an 8-digit Estonian code")
    private String registrationCode;

    @Min(value = 1, message = "Participant count must be at least 1")
    private Integer participantCount;

    @NotNull(message = "Payment method cannot be empty")
    private Participant.PaymentMethod paymentMethod;

    private String additionalInfo;
}
