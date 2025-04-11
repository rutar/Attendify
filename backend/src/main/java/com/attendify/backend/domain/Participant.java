package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Participant type must be specified")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Column(name = "first_name")
    private String firstName;

    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Column(name = "last_name")
    private String lastName;

    @Pattern(regexp = "^[0-6]\\d{10}$", message = "Personal code must be an 11-digit Estonian isikukood")
    @Column(name = "personal_code")
    private String personalCode;

    @Size(max = 100, message = "Company name must not exceed 100 characters")
    @Column(name = "company_name")
    private String companyName;

    @Pattern(regexp = "^\\d{8}$", message = "Registration code must be an 8-digit Estonian code")
    @Column(name = "registration_code")
    private String registrationCode;

    @Column(name = "participant_count")
    private Integer participantCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

    @Size(max = 1500, message = "Additional info must not exceed 1500 characters")
    @Column(name = "additional_info", length = 1500)
    private String additionalInfo;

    @ManyToMany(mappedBy = "participants")
    private List<Event> events = new ArrayList<>();

    public enum Type {
        INDIVIDUAL, COMPANY
    }

    public enum PaymentMethod {
        BANK_TRANSFER, CASH
    }
}