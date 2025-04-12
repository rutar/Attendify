package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "companies")
@DiscriminatorValue("COMPANY")
@Data
@NoArgsConstructor
public class Company extends Participant {
    @NotBlank(message = "Company name cannot be empty")
    @Size(max = 100, message = "Company name must not exceed 100 characters")
    @Column(name = "company_name", nullable = false)
    private String companyName;

    @NotBlank(message = "Registration code cannot be empty")
    @Size(max = 8, message = "Registration code must not exceed 8 characters")
    @Column(name = "registration_code", nullable = false, length = 8, unique = true)
    private String registrationCode;

    @Column(name = "participant_count")
    private Integer participantCount;

    @Size(max = 100, message = "Contact person must not exceed 100 characters")
    @Column(name = "contact_person")
    private String contactPerson;

    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Column(name = "email")
    private String email;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    @Column(name = "phone")
    private String phone;
}