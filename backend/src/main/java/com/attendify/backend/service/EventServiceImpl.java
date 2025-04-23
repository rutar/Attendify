package com.attendify.backend.service;

import com.attendify.backend.domain.Event;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.mapper.ParticipantMapper;
import com.attendify.backend.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {
    private final EventRepository eventRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Event> getFutureEvents() {
        return eventRepository.findByDateTimeAfterOrderByDateTime(Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getPastEvents() {
        return eventRepository.findByDateTimeBeforeOrderByDateTimeDesc(Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    @Override
    @Transactional
    public Event createEvent(Event event) {
        validateEvent(event);
        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public Event updateEvent(Event event) {
        Event existingEvent = getEventById(event.getId());
        validateEvent(event);
        existingEvent.setName(event.getName());
        existingEvent.setDateTime(event.getDateTime());
        existingEvent.setLocation(event.getLocation());
        existingEvent.setStatus(event.getStatus());
        existingEvent.setAdditionalInfo(event.getAdditionalInfo());
        return eventRepository.save(existingEvent);
    }

    @Override
    @Transactional
    public void deleteEvent(Long id) {
        Event event = getEventById(id);
        eventRepository.delete(event);
    }

    private void validateEvent(Event event) {
        // Validate name
        if (event.getName() == null || event.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Event name cannot be empty");
        }

        // Validate date time
        if (event.getDateTime() == null) {
            throw new IllegalArgumentException("Event date and time cannot be null");
        }

        // Check if date is in the past
        if (event.getDateTime().isBefore(Instant.now())){
            throw new IllegalArgumentException("Event cannot be in the past");
        }

        // Validate status
        if (event.getStatus() == null || event.getStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Event status cannot be empty");
        }
    }
}