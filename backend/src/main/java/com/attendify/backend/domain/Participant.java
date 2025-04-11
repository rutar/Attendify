package com.attendify.backend.domain;

import jakarta.persistence.*;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "personal_code")
    private String personalCode;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "registration_code")
    private String registrationCode;

    @Column(name = "participant_count")
    private Integer participantCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

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