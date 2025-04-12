package com.attendify.backend.service;

import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.EventParticipant;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.EventParticipantRepository;
import com.attendify.backend.repository.EventRepository;
import com.attendify.backend.repository.ParticipantRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {
    private final EventRepository eventRepository;
    private final ParticipantRepository participantRepository;
    private final EventParticipantRepository eventParticipantRepository;

    @Override
    public List<Event> getFutureEvents() {
        return eventRepository.findByDateTimeAfterOrderByDateTime(Instant.now());
    }

    @Override
    public List<Event> getPastEvents() {
        return eventRepository.findByDateTimeBeforeOrderByDateTimeDesc(Instant.now());
    }

    @Override
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    @Override
    @Transactional
    public Event createEvent(Event event) {
        if (!event.isFutureEvent()) {
            throw new IllegalArgumentException("Event date/time must be in the future");
        }
        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public Event updateEvent(Event event) {
        // Check if event exists
        Event existingEvent = eventRepository.findById(event.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + event.getId()));

        // Keep existing relationships
        event.setEventParticipants(existingEvent.getEventParticipants());
        event.setCreatedAt(existingEvent.getCreatedAt());

        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public void deleteEvent(Long id) {
        Event event = getEventById(id);
        if (!event.isFutureEvent()) {
            throw new IllegalArgumentException("Cannot delete past events");
        }
        eventRepository.delete(event);
    }

    @Override
    @Transactional
    public EventParticipant addParticipantToEvent(Long eventId, Long participantId, EventParticipant.AttendanceStatus status) {
        Event event = getEventById(eventId);
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + participantId));

        // Check if participant is already registered for this event
        if (event.hasParticipant(participant)) {
            throw new IllegalArgumentException("Participant is already registered for this event");
        }

        // Create new EventParticipant entity
        EventParticipant eventParticipant = new EventParticipant(event, participant);

        // Set attendance status if provided
        if (status != null) {
            eventParticipant.setAttendanceStatus(status);
        }

        // Save the relationship
        event.getEventParticipants().add(eventParticipant);
        participant.getEventParticipants().add(eventParticipant);

        eventRepository.save(event);
        return eventParticipant;
    }

    @Override
    @Transactional
    public EventParticipant updateParticipantStatus(Long eventId, Long participantId, EventParticipant.AttendanceStatus status) {
        Event event = getEventById(eventId);
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + participantId));

        EventParticipant eventParticipant = event.getEventParticipants().stream()
                .filter(ep -> ep.getParticipant().getId().equals(participantId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Participant not registered for this event"));

        eventParticipant.setAttendanceStatus(status);
        eventRepository.save(event); // This will cascade to EventParticipant

        return eventParticipant;
    }

    @Override
    @Transactional
    public void removeParticipantFromEvent(Long eventId, Long participantId) {
        Event event = getEventById(eventId);
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + participantId));

        if (!event.hasParticipant(participant)) {
            throw new ResourceNotFoundException("Participant not registered for this event");
        }

        event.removeParticipant(participant);
        eventRepository.save(event);
    }
}