
package com.attendify.backend.controller;

import com.attendify.backend.domain.Event;
import com.attendify.backend.dto.EventDTO;
import com.attendify.backend.dto.ParticipantDTO;
import com.attendify.backend.mapper.EventMapper;
import com.attendify.backend.mapper.ParticipantMapper;
import com.attendify.backend.service.EventParticipantService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

    @RestController
    @RequestMapping("/api/events")
    @RequiredArgsConstructor
    @Tag(name = "Event Management", description = "APIs for managing events.")
    public class EventController {
        private final EventService eventService;
        private final EventMapper eventMapper;
        private final ParticipantMapper participantMapper;
        private final EventParticipantService eventParticipantService;

        @Operation(summary = "Retrieve all events", description = "Fetches a list of all future and past events.")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "Successfully retrieved events",
                        content = @Content(schema = @Schema(implementation = Map.class)))
        })
        @GetMapping
        @Transactional(readOnly = true)
        public ResponseEntity<Map<String, List<EventDTO>>> getAllEvents() {
            Map<String, List<EventDTO>> response = new HashMap<>();
            response.put("futureEvents", eventService.getFutureEvents().stream()
                    .map(eventMapper::toDto)
                    .toList());
            response.put("pastEvents", eventService.getPastEvents().stream()
                    .map(eventMapper::toDto)
                    .toList());
            return ResponseEntity.ok(response);
        }

        @Operation(summary = "Retrieve an event by ID", description = "Fetches a specific event by its ID.")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "Successfully retrieved event",
                        content = @Content(schema = @Schema(implementation = EventDTO.class))),
                @ApiResponse(responseCode = "404", description = "Event not found")
        })
        @GetMapping("/{id}")
        @Transactional(readOnly = true)
        public ResponseEntity<EventDTO> getEventById(
                @Parameter(description = "ID of the event", example = "1") @PathVariable Long id) {
            Event event = eventService.getEventById(id);
            return ResponseEntity.ok(eventMapper.toDto(event));
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
            Event event = eventMapper.toEntity(eventDTO);
            Event createdEvent = eventService.createEvent(event);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(eventMapper.toDto(createdEvent));
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
            Event event = eventMapper.toEntity(eventDTO);
            event.setId(id);
            Event updatedEvent = eventService.updateEvent(event);
            return ResponseEntity.ok(eventMapper.toDto(updatedEvent));
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

        @Operation(summary = "Retrieve participants for an event", description = "Fetches all participants registered for a specific event.")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "Successfully retrieved participants",
                        content = @Content(schema = @Schema(implementation = ParticipantDTO.class))),
                @ApiResponse(responseCode = "404", description = "Event not found")
        })
        @GetMapping("/{id}/participants")
        @Transactional(readOnly = true)
        public ResponseEntity<List<ParticipantDTO>> getEventParticipants(
                @Parameter(description = "ID of the event", example = "1") @PathVariable Long id) {
            Event event = eventService.getEventById(id);
            List<ParticipantDTO> participants = event.getParticipants().stream()
                    .map(participantMapper::toDto)
                    .toList();
            return ResponseEntity.ok(participants);
        }

        @Operation(summary = "Add participant to an event", description = "Adds a new or existing participant to the specified event. If participant ID is provided, associates the existing participant; otherwise, creates a new participant.")
        @ApiResponses({
                @ApiResponse(responseCode = "201", description = "Participant added successfully",
                        content = @Content(schema = @Schema(implementation = ParticipantDTO.class))),
                @ApiResponse(responseCode = "400", description = "Invalid participant data"),
                @ApiResponse(responseCode = "404", description = "Event or participant not found")
        })
        @PostMapping("/{eventId}/participants")
        @Transactional
        public ResponseEntity<ParticipantDTO> addParticipantToEvent(
                @Parameter(description = "ID of the event", example = "1") @PathVariable Long eventId,
                @Valid @RequestBody @Schema(description = "Participant details") ParticipantDTO participantDTO) {
            ParticipantDTO addedParticipant = eventParticipantService.addParticipantToEvent(eventId, participantDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(addedParticipant);
        }

        @Operation(summary = "Remove participant from an event", description = "Removes a participant from the specified event.")
        @ApiResponses({
                @ApiResponse(responseCode = "204", description = "Participant removed successfully"),
                @ApiResponse(responseCode = "404", description = "Event or participant not found")
        })
        @DeleteMapping("/{eventId}/participants/{participantId}")
        @Transactional
        public ResponseEntity<Void> removeParticipantFromEvent(
                @Parameter(description = "ID of the event", example = "1") @PathVariable Long eventId,
                @Parameter(description = "ID of the participant to remove", example = "1") @PathVariable Long participantId) {
            eventParticipantService.removeParticipantFromEvent(eventId, participantId);
            return ResponseEntity.noContent().build();
        }

}