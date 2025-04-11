package com.attendify.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
public class Company extends Participant {
    @NotBlank(message = "Company name cannot be empty")
    @Size(max = 100, message = "Company name must not exceed 100 characters")
    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Pattern(regexp = "^\\d{8}$", message = "Registration code must be an 8-digit Estonian code")
    @Column(name = "registration_code", nullable = false)
    private String registrationCode;

    @Column(name = "participant_count")
    private Integer participantCount;
}