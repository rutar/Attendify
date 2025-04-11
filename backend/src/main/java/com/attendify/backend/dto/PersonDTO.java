package com.attendify.backend.dto;

import com.attendify.backend.domain.Participant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PersonDTO {
    private Long id;

    @NotBlank(message = "First name cannot be empty")
    private String firstName;

    @NotBlank(message = "Last name cannot be empty")
    private String lastName;

    @Pattern(regexp = "^[0-6]\\d{10}$", message = "Personal code must be an 11-digit Estonian isikukood")
    private String personalCode;

    @NotNull(message = "Payment method cannot be empty")
    private Participant.PaymentMethod paymentMethod;

    private String additionalInfo;
}
