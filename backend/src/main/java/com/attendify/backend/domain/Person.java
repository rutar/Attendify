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
@Table(name = "persons")
@Data
@NoArgsConstructor
public class Person extends Participant {
    @NotBlank(message = "First name cannot be empty")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank(message = "Last name cannot be empty")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Pattern(regexp = "^[0-6]\\d{10}$", message = "Personal code must be an 11-digit Estonian isikukood")
    @Column(name = "personal_code", nullable = false)
    private String personalCode;
}