package com.attendify.backend.repository;

import com.attendify.backend.domain.EventParticipant;
import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.EventParticipantId;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, EventParticipantId> {

    List<EventParticipant> findByEvent(Event event);

    List<EventParticipant> findByParticipant(Participant participant);

    Optional<EventParticipant> findByEventAndParticipant(Event event, Participant participant);

    boolean existsByEventAndParticipant(Event event, Participant participant);

    void deleteByEventAndParticipant(Event event, Participant participant);

    void deleteByEvent(Event event);
}
