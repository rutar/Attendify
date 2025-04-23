package com.attendify.backend.service;

import com.attendify.backend.dto.ParticipantDTO;

public interface EventParticipantService {
    ParticipantDTO addParticipantToEvent(Long eventId, ParticipantDTO participantDTO);

    void removeParticipantFromEvent(Long eventId, Long participantId);
}