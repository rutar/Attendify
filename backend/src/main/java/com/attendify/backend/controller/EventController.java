package com.attendify.backend.controller;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.Person;
import com.attendify.backend.dto.EventDTO;
import com.attendify.backend.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;
    private final ModelMapper modelMapper;

    @GetMapping
    public ResponseEntity<Map<String, List<EventDTO>>> getAllEvents() {
        Map<String, List<EventDTO>> response = new HashMap<>();

        List<EventDTO> futureEvents = eventService.getFutureEvents().stream()
                .map(event -> {
                    EventDTO dto = modelMapper.map(event, EventDTO.class);
                    dto.setParticipantCount(event.getParticipants().size());
                    return dto;
                })
                .collect(Collectors.toList());

        List<EventDTO> pastEvents = eventService.getPastEvents().stream()
                .map(event -> {
                    EventDTO dto = modelMapper.map(event, EventDTO.class);
                    dto.setParticipantCount(event.getParticipants().size());
                    return dto;
                })
                .collect(Collectors.toList());

        response.put("futureEvents", futureEvents);
        response.put("pastEvents", pastEvents);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        EventDTO eventDTO = modelMapper.map(event, EventDTO.class);
        eventDTO.setParticipantCount(event.getParticipants().size());
        return ResponseEntity.ok(eventDTO);
    }

    @PostMapping
    public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody EventDTO eventDTO) {
        Event event = modelMapper.map(eventDTO, Event.class);
        Event createdEvent = eventService.createEvent(event);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(modelMapper.map(createdEvent, EventDTO.class));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<Map<String, Object>>> getEventParticipants(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        List<Map<String, Object>> participantDTOs = event.getParticipants().stream()
                .map(participant -> {
                    Map<String, Object> participantMap = new HashMap<>();
                    participantMap.put("id", participant.getId());

                    if (participant instanceof Person) {
                        Person person = (Person) participant;
                        participantMap.put("type", "PERSON");
                        participantMap.put("name", person.getFirstName() + " " + person.getLastName());
                        participantMap.put("code", person.getPersonalCode());
                    } else if (participant instanceof Company) {
                        Company company = (Company) participant;
                        participantMap.put("type", "COMPANY");
                        participantMap.put("name", company.getCompanyName());
                        participantMap.put("code", company.getRegistrationCode());
                        participantMap.put("participantCount", company.getParticipantCount());
                    }

                    participantMap.put("paymentMethod", participant.getPaymentMethod());

                    return participantMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(participantDTOs);
    }

    @PostMapping("/{eventId}/participants/{participantId}")
    public ResponseEntity<Void> addParticipantToEvent(
            @PathVariable Long eventId,
            @PathVariable Long participantId) {
        eventService.addParticipantToEvent(eventId, participantId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{eventId}/participants/{participantId}")
    public ResponseEntity<Void> removeParticipantFromEvent(
            @PathVariable Long eventId,
            @PathVariable Long participantId) {
        eventService.removeParticipantFromEvent(eventId, participantId);
        return ResponseEntity.noContent().build();
    }
}