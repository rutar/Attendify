package com.attendify.backend.service;

import com.attendify.backend.domain.Participant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ParticipantService {
    Page<Participant> getAllParticipants(Pageable pageable);

    Participant getParticipantById(Long id);

    Participant createParticipant(Participant participant);

    Participant updateParticipant(Long id, Participant participantDetails);

    void deleteParticipant(Long id);

    Page<Participant> searchParticipants(String query, String type, String field, Pageable pageable);
}