package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Event name cannot be empty")
    @Size(max = 100, message = "Event name must not exceed 100 characters")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Date and time must be specified")
    @Future(message = "Event date must be in the future")
    @Column(name = "date_time", nullable = false)
    private OffsetDateTime dateTime;

    @NotBlank(message = "Location cannot be empty")
    @Size(max = 200, message = "Location must not exceed 200 characters")
    @Column(nullable = false)
    private String location;

    @Size(max = 1000, message = "Additional info must not exceed 1000 characters")
    @Column(name = "additional_info", length = 1000)
    private String additionalInfo;

    @ManyToMany(mappedBy = "events", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Participant> participants = new ArrayList<>();

    public void addParticipant(Participant participant) {
        participants.add(participant);
        if (!participant.getEvents().contains(this)) {
            participant.getEvents().add(this);
        }
    }

    public void removeParticipant(Participant participant) {
        participants.remove(participant);
        if (participant.getEvents().contains(this)) {
            participant.getEvents().remove(this);
        }
    }

    public boolean isFutureEvent() {
        return dateTime.isAfter(OffsetDateTime.now());
    }

    public int getParticipantCount() {
        return participants.size();
    }

    public boolean hasParticipant(Participant participant) {
        return participants.contains(participant);
    }
}