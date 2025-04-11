package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@Data
public abstract class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;
    @Size(max = 1500, message = "Additional info must not exceed 1500 characters")
    @Column(name = "additional_info", length = 1500)
    private String additionalInfo;
    @ManyToMany
    @JoinTable(name = "event_participant", joinColumns = @JoinColumn(name = "participant_id"), inverseJoinColumns = @JoinColumn(name = "event_id"))
    private List<Event> events = new ArrayList<>();

    public enum PaymentMethod {BANK_TRANSFER, CASH}
}