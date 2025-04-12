package com.attendify.backend.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "event_participant")
@Data
@NoArgsConstructor
public class EventParticipant {
    @EmbeddedId
    private EventParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("eventId")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("participantId")
    private Participant participant;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status")
    private AttendanceStatus attendanceStatus = AttendanceStatus.REGISTERED;

    @Column(name = "registered_at")
    private Instant registeredAt = Instant.now();

    public EventParticipant(Event event, Participant participant) {
        this.event = event;
        this.participant = participant;
        this.id = new EventParticipantId(event.getId(), participant.getId());
    }

    public enum AttendanceStatus {
        REGISTERED, CONFIRMED, ATTENDED, NO_SHOW
    }

    @Embeddable
    @Data
    public static class EventParticipantId implements Serializable {
        @Column(name = "event_id")
        private Long eventId;

        @Column(name = "participant_id")
        private Long participantId;

        public EventParticipantId() {}

        public EventParticipantId(Long eventId, Long participantId) {
            this.eventId = eventId;
            this.participantId = participantId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            EventParticipantId that = (EventParticipantId) o;
            return Objects.equals(eventId, that.eventId) &&
                    Objects.equals(participantId, that.participantId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(eventId, participantId);
        }
    }
}