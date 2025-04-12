package com.attendify.backend.controller;

import com.attendify.backend.domain.*;
import com.attendify.backend.dto.EventDTO;
import com.attendify.backend.dto.EventParticipantDTO;
import com.attendify.backend.dto.ParticipantDTO;
import com.attendify.backend.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Event Management", description = "APIs for managing events and their participants.")
public class EventController {
    private final EventService eventService;
    private final ModelMapper modelMapper;

    @Operation(summary = "Retrieve all events", description = "Fetches a list of all future and past events.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved events",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping
    public ResponseEntity<Map<String, List<EventDTO>>> getAllEvents() {
        Map<String, List<EventDTO>> response = new HashMap<>();

        List<EventDTO> futureEvents = eventService.getFutureEvents().stream()
                .map(event -> {
                    EventDTO dto = modelMapper.map(event, EventDTO.class);
                    dto.setParticipantCount(event.getParticipantCount());
                    return dto;
                })
                .collect(Collectors.toList());

        List<EventDTO> pastEvents = eventService.getPastEvents().stream()
                .map(event -> {
                    EventDTO dto = modelMapper.map(event, EventDTO.class);
                    dto.setParticipantCount(event.getParticipantCount());
                    return dto;
                })
                .collect(Collectors.toList());

        response.put("futureEvents", futureEvents);
        response.put("pastEvents", pastEvents);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Retrieve an event by ID", description = "Fetches details of a specific event by its ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved event",
                    content = @Content(schema = @Schema(implementation = EventDTO.class))),
            @ApiResponse(responseCode = "404", description = "Event not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(
            @Parameter(description = "ID of the event to retrieve", example = "1") @PathVariable Long id) {
        Event event = eventService.getEventById(id);
        EventDTO eventDTO = modelMapper.map(event, EventDTO.class);
        eventDTO.setParticipantCount(event.getParticipantCount());
        return ResponseEntity.ok(eventDTO);
    }

    @Operation(summary = "Create a new event", description = "Creates a new event with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Event created successfully",
                    content = @Content(schema = @Schema(implementation = EventDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid event details")
    })
    @PostMapping
    public ResponseEntity<EventDTO> createEvent(
            @Valid @RequestBody @Schema(description = "Event details") EventDTO eventDTO) {
        Event event = modelMapper.map(eventDTO, Event.class);
        Event createdEvent = eventService.createEvent(event);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(modelMapper.map(createdEvent, EventDTO.class));
    }

    @Operation(summary = "Update an event", description = "Updates an existing event with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Event updated successfully",
                    content = @Content(schema = @Schema(implementation = EventDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid event details"),
            @ApiResponse(responseCode = "404", description = "Event not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(
            @Parameter(description = "ID of the event to update", example = "1") @PathVariable Long id,
            @Valid @RequestBody @Schema(description = "Updated event details") EventDTO eventDTO) {
        Event event = modelMapper.map(eventDTO, Event.class);
        event.setId(id);
        Event updatedEvent = eventService.updateEvent(event);
        return ResponseEntity.ok(modelMapper.map(updatedEvent, EventDTO.class));
    }

    @Operation(summary = "Delete an event", description = "Deletes an event by its ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Event deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Event not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @Parameter(description = "ID of the event to delete", example = "1") @PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Retrieve participants of an event", description = "Fetches a list of participants registered for a specific event.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved participants",
                    content = @Content(schema = @Schema(implementation = EventParticipantDTO.class))),
            @ApiResponse(responseCode = "404", description = "Event not found")
    })
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<EventParticipantDTO>> getEventParticipants(
            @Parameter(description = "ID of the event", example = "1") @PathVariable Long id) {
        Event event = eventService.getEventById(id);
        List<EventParticipantDTO> participantDTOs = event.getEventParticipants().stream()
                .map(eventParticipant -> {
                    EventParticipantDTO dto = new EventParticipantDTO();
                    Participant participant = eventParticipant.getParticipant();

                    ParticipantDTO participantDTO = new ParticipantDTO();
                    participantDTO.setId(participant.getId());
                    participantDTO.setPaymentMethod(participant.getPaymentMethod());
                    participantDTO.setAdditionalInfo(participant.getAdditionalInfo());

                    if (participant instanceof Person person) {
                        participantDTO.setType("PERSON");
                        participantDTO.setName(person.getFirstName() + " " + person.getLastName());
                        participantDTO.setCode(person.getPersonalCode());
                        participantDTO.setEmail(person.getEmail());
                        participantDTO.setPhone(person.getPhone());
                    } else if (participant instanceof Company company) {
                        participantDTO.setType("COMPANY");
                        participantDTO.setName(company.getCompanyName());
                        participantDTO.setCode(company.getRegistrationCode());
                        participantDTO.setParticipantCount(company.getParticipantCount());
                        participantDTO.setContactPerson(company.getContactPerson());
                        participantDTO.setEmail(company.getEmail());
                        participantDTO.setPhone(company.getPhone());
                    }

                    dto.setParticipant(participantDTO);
                    dto.setAttendanceStatus(eventParticipant.getAttendanceStatus());
                    dto.setRegisteredAt(eventParticipant.getRegisteredAt());

                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(participantDTOs);
    }

    @Operation(summary = "Add a participant to an event", description = "Registers a participant to a specific event with an optional attendance status.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Participant added successfully",
                    content = @Content(schema = @Schema(implementation = EventParticipantDTO.class))),
            @ApiResponse(responseCode = "404", description = "Event or participant not found"),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    @PostMapping("/{eventId}/participants/{participantId}")
    public ResponseEntity<EventParticipantDTO> addParticipantToEvent(
            @Parameter(description = "ID of the event", example = "1") @PathVariable Long eventId,
            @Parameter(description = "ID of the participant", example = "2") @PathVariable Long participantId,
            @Parameter(description = "Attendance status (optional)", example = "REGISTERED") @RequestParam(required = false) EventParticipant.AttendanceStatus status) {
        EventParticipant eventParticipant = eventService.addParticipantToEvent(eventId, participantId, status);
        EventParticipantDTO dto = modelMapper.map(eventParticipant, EventParticipantDTO.class);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(dto);
    }

    @Operation(summary = "Update participant status", description = "Updates the attendance status of a participant for a specific event.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated successfully",
                    content = @Content(schema = @Schema(implementation = EventParticipantDTO.class))),
            @ApiResponse(responseCode = "404", description = "Event or participant not found"),
            @ApiResponse(responseCode = "400", description = "Invalid status")
    })
    @PutMapping("/{eventId}/participants/{participantId}/status")
    public ResponseEntity<EventParticipantDTO> updateParticipantStatus(
            @Parameter(description = "ID of the event", example = "1") @PathVariable Long eventId,
            @Parameter(description = "ID of the participant", example = "2") @PathVariable Long participantId,
            @Parameter(description = "New attendance status", example = "ATTENDED") @RequestParam EventParticipant.AttendanceStatus status) {
        EventParticipant eventParticipant = eventService.updateParticipantStatus(eventId, participantId, status);
        EventParticipantDTO dto = modelMapper.map(eventParticipant, EventParticipantDTO.class);
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "Remove participant from event", description = "Removes a participant from a specific event.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Participant removed successfully"),
            @ApiResponse(responseCode = "404", description = "Event or participant not found")
    })
    @DeleteMapping("/{eventId}/participants/{participantId}")
    public ResponseEntity<Void> removeParticipantFromEvent(
            @Parameter(description = "ID of the event", example = "1") @PathVariable Long eventId,
            @Parameter(description = "ID of the participant", example = "2") @PathVariable Long participantId) {
        eventService.removeParticipantFromEvent(eventId, participantId);
        return ResponseEntity.noContent().build();
    }
}