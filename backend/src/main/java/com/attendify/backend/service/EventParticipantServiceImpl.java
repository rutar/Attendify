package com.attendify.backend.service;

import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.dto.ParticipantDTO;
import com.attendify.backend.exception.DuplicateResourceException;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.mapper.ParticipantMapper;
import com.attendify.backend.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EventParticipantServiceImpl implements EventParticipantService {
    private final EventRepository eventRepository;
    private final ParticipantService participantService;
    private final ParticipantMapper participantMapper;

    @Override
    @Transactional
    public ParticipantDTO addParticipantToEvent(Long eventId, ParticipantDTO participantDTO) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        Participant participant;

        if (participantDTO.getId() != null) {
            // Existing participant
            participant = participantService.getParticipantById(participantDTO.getId());
        } else {
            // New participant
            validateParticipantDTO(participantDTO);
            participant = participantMapper.toEntity(participantDTO);
            participant = participantService.createParticipant(participant);
        }

        if (event.getParticipants().contains(participant)) {
            throw new DuplicateResourceException("Participant is already registered for this event");
        }

        event.getParticipants().add(participant);
        eventRepository.save(event);
        return participantMapper.toDto(participant);
    }

    @Override
    @Transactional
    public void removeParticipantFromEvent(Long eventId, Long participantId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        Participant participant = participantService.getParticipantById(participantId);

        if (!event.getParticipants().contains(participant)) {
            throw new ResourceNotFoundException("Participant with id: " + participantId + " is not registered for event with id: " + eventId);
        }

        event.getParticipants().remove(participant);
        eventRepository.save(event);
    }

    private void validateParticipantDTO(ParticipantDTO participantDTO) {
        if (participantDTO.getType() == null || (!participantDTO.getType().equals("PERSON") && !participantDTO.getType().equals("COMPANY"))) {
            throw new IllegalArgumentException("Participant type must be PERSON or COMPANY");
        }
        if ("PERSON".equals(participantDTO.getType())) {
            if (participantDTO.getFirstName() == null || participantDTO.getFirstName().trim().isEmpty()) {
                throw new IllegalArgumentException("First name cannot be empty for person");
            }
            if (participantDTO.getLastName() == null || participantDTO.getLastName().trim().isEmpty()) {
                throw new IllegalArgumentException("Last name cannot be empty for person");
            }
            if (participantDTO.getPersonalCode() == null || participantDTO.getPersonalCode().trim().isEmpty()) {
                throw new IllegalArgumentException("Personal code cannot be empty for person");
            }
        } else {
            if (participantDTO.getCompanyName() == null || participantDTO.getCompanyName().trim().isEmpty()) {
                throw new IllegalArgumentException("Company name cannot be empty for company");
            }
            if (participantDTO.getRegistrationCode() == null || participantDTO.getRegistrationCode().trim().isEmpty()) {
                throw new IllegalArgumentException("Registration code cannot be empty for company");
            }
        }
    }
}