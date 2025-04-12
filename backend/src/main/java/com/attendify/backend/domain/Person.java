package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "persons")
@DiscriminatorValue("PERSON")
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

    @NotBlank(message = "Personal code cannot be empty")
    @Pattern(regexp = "^[0-6]\\d{10}$", message = "Personal code must be an 11-digit Estonian isikukood")
    @Column(name = "personal_code", nullable = false, length = 11, unique = true)
    private String personalCode;

    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Column(name = "email")
    private String email;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    @Column(name = "phone")
    private String phone;
}