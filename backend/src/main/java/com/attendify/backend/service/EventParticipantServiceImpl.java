package com.attendify.backend.service;

import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.EventParticipant;
import com.attendify.backend.domain.EventParticipant.AttendanceStatus;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.dto.ParticipantDTO;
import com.attendify.backend.exception.DuplicateResourceException;
import com.attendify.backend.repository.EventParticipantRepository;
import com.attendify.backend.repository.EventRepository;
import com.attendify.backend.repository.ParticipantRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventParticipantServiceImpl implements EventParticipantService {

    private final EventRepository eventRepository;
    private final ParticipantRepository participantRepository;
    private final EventParticipantRepository eventParticipantRepository;

    @Override
    @Transactional
    public ParticipantDTO addParticipantToEvent(Long eventId, ParticipantDTO participantDTO) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Participant participant = participantRepository.findById(participantDTO.getId())
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));

        boolean alreadyRegistered = eventParticipantRepository.existsByEventAndParticipant(event, participant);
        if (alreadyRegistered) {
            throw new DuplicateResourceException("Participant already registered to event");
        }

        EventParticipant eventParticipant = new EventParticipant();
        eventParticipant.setEvent(event);
        eventParticipant.setParticipant(participant);
        eventParticipant.setAttendanceStatus(AttendanceStatus.REGISTERED);

        eventParticipantRepository.save(eventParticipant);

        return participantDTO;
    }

    @Override
    @Transactional
    public void removeParticipantFromEvent(Long eventId, Long participantId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));

        eventParticipantRepository.deleteByEventAndParticipant(event, participant);
    }
}
