package com.attendify.backend.repository;

import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.EventParticipant;
import com.attendify.backend.domain.EventParticipantId;
import com.attendify.backend.domain.Participant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, EventParticipantId> {

    boolean existsByEventAndParticipant(Event event, Participant participant);

    void deleteByEventAndParticipant(Event event, Participant participant);

    void deleteByEvent(Event event);
}
