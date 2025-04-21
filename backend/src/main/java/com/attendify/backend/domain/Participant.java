package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "participants")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "participant_type")
@Data
@NoArgsConstructor
public abstract class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Size(max = 1500, message = "Additional info must not exceed 1500 characters")
    @Column(name = "additional_info", length = 1500)
    private String additionalInfo;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum PaymentMethod {BANK_TRANSFER, CASH, CARD}
}