package com.attendify.backend.mapper;

import com.attendify.backend.domain.Event;
import com.attendify.backend.dto.EventDTO;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    public EventDTO toDto(Event event) {
        EventDTO eventDTO = new EventDTO();
        eventDTO.setId(event.getId());
        eventDTO.setName(event.getName());
        eventDTO.setDateTime(event.getDateTime());
        eventDTO.setLocation(event.getLocation());
        eventDTO.setStatus(event.getStatus());
        eventDTO.setAdditionalInfo(event.getAdditionalInfo());
        eventDTO.setCreatedAt(event.getCreatedAt());
        eventDTO.setUpdatedAt(event.getUpdatedAt());
        return eventDTO;
    }

    public Event toEntity(EventDTO eventDTO) {
        Event event = new Event();
        event.setId(eventDTO.getId());
        event.setName(eventDTO.getName());
        event.setDateTime(eventDTO.getDateTime());
        event.setLocation(eventDTO.getLocation());
        event.setStatus(eventDTO.getStatus());
        event.setAdditionalInfo(eventDTO.getAdditionalInfo());
        return event;
    }
}