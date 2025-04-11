package com.attendify.backend.repository;

import com.attendify.backend.domain.Participant;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ParticipantRepository extends JpaRepository<Participant, Long> {
}

