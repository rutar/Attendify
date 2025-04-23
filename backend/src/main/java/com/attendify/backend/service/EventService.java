package com.attendify.backend.service;

import com.attendify.backend.domain.Event;

import java.util.List;

public interface EventService {
    List<Event> getFutureEvents();
    List<Event> getPastEvents();
    Event getEventById(Long id);
    Event createEvent(Event event);
    Event updateEvent(Event event);
    void deleteEvent(Long id);
}