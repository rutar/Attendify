package com.attendify.backend.service;

import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.EventRepository;
import com.attendify.backend.repository.ParticipantRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final ParticipantRepository participantRepository;

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public List<Event> getFutureEvents() {
        return eventRepository.findByEventDateTimeAfterOrderByEventDateTime(LocalDateTime.now());
    }

    public List<Event> getPastEvents() {
        return eventRepository.findByEventDateTimeBeforeOrderByEventDateTimeDesc(LocalDateTime.now());
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    @Transactional
    public Event createEvent(Event event) {
        if (!event.isFutureEvent()) {
            throw new IllegalArgumentException("Event date/time must be in the future");
        }
        return eventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = getEventById(id);
        if (!event.isFutureEvent()) {
            throw new IllegalArgumentException("Cannot delete past events");
        }
        eventRepository.delete(event);
    }

    @Transactional
    public void addParticipantToEvent(Long eventId, Long participantId) {
        Event event = getEventById(eventId);
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + participantId));

        event.addParticipant(participant);
        eventRepository.save(event);
    }

    @Transactional
    public void removeParticipantFromEvent(Long eventId, Long participantId) {
        Event event = getEventById(eventId);
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + participantId));

        event.removeParticipant(participant);
        eventRepository.save(event);
    }
}
