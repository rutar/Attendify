package com.attendify.backend.dto;

import com.attendify.backend.domain.Participant;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Schema(description = "Data Transfer Object for a person participant, containing personal details and payment information.")
public class PersonDTO {
    @Schema(description = "Unique identifier of the person.", example = "1")
    private Long id;

    @NotBlank(message = "First name cannot be empty")
    @Schema(description = "First name of the person.", example = "John", required = true)
    private String firstName;

    @NotBlank(message = "Last name cannot be empty")
    @Schema(description = "Last name of the person.", example = "Doe", required = true)
    private String lastName;

    @Pattern(regexp = "^[0-6]\\d{10}$", message = "Personal code must be an 11-digit Estonian isikukood")
    @Schema(description = "Estonian personal code (isikukood), 11 digits starting with 0-6.", example = "39005270891", required = true)
    private String personalCode;

    @NotNull(message = "Payment method cannot be empty")
    @Schema(description = "Payment method chosen by the person.", example = "BANK_TRANSFER", required = true, allowableValues = {"BANK_TRANSFER", "CASH", "CARD"})
    private Participant.PaymentMethod paymentMethod;

    @Schema(description = "Additional information provided by the person.", example = "Requires wheelchair access")
    private String additionalInfo;
}