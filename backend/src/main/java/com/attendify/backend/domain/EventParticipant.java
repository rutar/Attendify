package com.attendify.backend.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "event_participant")
@Data
@NoArgsConstructor
@IdClass(EventParticipantId.class)
public class EventParticipant {

    @Id
    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Id
    @ManyToOne
    @JoinColumn(name = "participant_id", nullable = false)
    private Participant participant;

    @Column(name = "attendance_status", length = 20)
    @Enumerated(EnumType.STRING)
    private AttendanceStatus attendanceStatus = AttendanceStatus.REGISTERED;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt = Instant.now();

    public enum AttendanceStatus {
        REGISTERED, ATTENDED, CANCELLED
    }
}
