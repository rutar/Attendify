package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events", indexes = {
        @Index(name = "idx_event_datetime", columnList = "date_time"),
        @Index(name = "idx_event_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "event_seq")
    @SequenceGenerator(name = "event_seq", sequenceName = "events_id_seq", allocationSize = 1)
    private Long id;

    @NotBlank(message = "Event name cannot be empty")
    @Size(max = 100, message = "Event name must not exceed 100 characters")
    @Column(name = "name", nullable = false)
    private String name;

    @NotNull(message = "Event date must be specified")
    @Column(name = "date_time", nullable = false)
    private Instant dateTime;

    @Size(max = 200, message = "Location must not exceed 200 characters")
    @Column(name = "location")
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private EventStatus status = EventStatus.ACTIVE;

    @Size(max = 1500, message = "Additional info must not exceed 1500 characters")
    @Column(name = "additional_info")
    private String additionalInfo;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventParticipant> eventParticipants = new ArrayList<>();

    public enum EventStatus {
        ACTIVE, CANCELLED
    }

    public void addParticipant(Participant participant) {
        EventParticipant eventParticipant = new EventParticipant(this, participant);
        eventParticipants.add(eventParticipant);
        participant.getEventParticipants().add(eventParticipant);
    }

    public void removeParticipant(Participant participant) {
        EventParticipant eventParticipant = findEventParticipant(participant);
        if (eventParticipant != null) {
            eventParticipants.remove(eventParticipant);
            participant.getEventParticipants().remove(eventParticipant);
            eventParticipant.setEvent(null);
            eventParticipant.setParticipant(null);
        }
    }

    public boolean isFutureEvent() {
        return dateTime.isAfter(Instant.now());
    }

    public int getParticipantCount() {
        return eventParticipants.size();
    }

    public boolean hasParticipant(Participant participant) {
        return findEventParticipant(participant) != null;
    }

    private EventParticipant findEventParticipant(Participant participant) {
        return eventParticipants.stream()
                .filter(ep -> ep.getParticipant().equals(participant))
                .findFirst()
                .orElse(null);
    }
}