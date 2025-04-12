package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "participants")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "participant_type")
@Data
@NoArgsConstructor
public abstract class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "participant_seq")
    @SequenceGenerator(name = "participant_seq", sequenceName = "participants_id_seq", allocationSize = 1)
    private Long id;

    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventParticipant> eventParticipants = new ArrayList<>();

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

    public List<Event> getEvents() {
        return eventParticipants.stream()
                .map(EventParticipant::getEvent)
                .toList();
    }
}