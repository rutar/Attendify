package com.attendify.backend.mapper;

import com.attendify.backend.domain.Event;
import com.attendify.backend.dto.EventDTO;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    public EventDTO toDto(Event event) {
        EventDTO dto = new EventDTO();
        dto.setId(event.getId());
        dto.setName(event.getName());
        dto.setDateTime(event.getDateTime());
        dto.setLocation(event.getLocation());
        dto.setStatus(event.getStatus());
        dto.setAdditionalInfo(event.getAdditionalInfo());
        return dto;
    }

    public Event toEntity(EventDTO dto) {
        Event event = new Event();
        event.setId(dto.getId());
        event.setName(dto.getName());
        event.setDateTime(dto.getDateTime());
        event.setLocation(dto.getLocation());
        event.setStatus(dto.getStatus());
        event.setAdditionalInfo(dto.getAdditionalInfo());
        return event;
    }
}