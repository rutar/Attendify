package com.attendify.backend.repository;

import com.attendify.backend.domain.EventParticipant;
import com.attendify.backend.domain.EventParticipant.EventParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, EventParticipantId> {
}