package com.attendify.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events", indexes = {
        @Index(name = "idx_events_date_time", columnList = "date_time"),
        @Index(name = "idx_events_status", columnList = "status")
})
@Getter
@Setter
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "events_id_seq")
    @SequenceGenerator(name = "events_id_seq", sequenceName = "events_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "date_time", nullable = false)
    private Instant dateTime;

    private String location;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "additional_info", length = 1500)
    private String additionalInfo;

    @Column(name = "total_participants")
    private Integer totalParticipants;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ManyToMany
    @JoinTable(
            name = "event_participant",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private List<Participant> participants = new ArrayList<>();
}