package com.attendify.backend.controller;

import com.attendify.backend.domain.Participant;
import com.attendify.backend.dto.ParticipantDTO;
import com.attendify.backend.mapper.ParticipantMapper;
import com.attendify.backend.service.ParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
@Tag(name = "Participant Management", description = "APIs for managing participants (persons and companies).")
public class ParticipantController {
    private final ParticipantService participantService;
    private final ParticipantMapper participantMapper;

    @GetMapping
    @Operation(summary = "Get participants", description = "Retrieves a paginated list of participants, optionally filtered by query, type, and field.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Participants retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Participant.class))),
            @ApiResponse(responseCode = "400", description = "Invalid query parameters")
    })
    public Page<Participant> getParticipants(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String field,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return participantService.searchParticipants(query, type, field, pageable);
    }

    @Operation(summary = "Create a new participant", description = "Creates a new participant (person or company) with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Participant created successfully",
                    content = @Content(schema = @Schema(implementation = ParticipantDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid participant details")
    })
    @PostMapping
    public ResponseEntity<ParticipantDTO> createParticipant(
            @Valid @RequestBody @Schema(description = "Participant details") ParticipantDTO participantDTO) {
        Participant participant = participantMapper.toEntity(participantDTO);
        Participant createdParticipant = participantService.createParticipant(participant);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(participantMapper.toDto(createdParticipant));
    }

    @Operation(summary = "Update a participant", description = "Updates an existing participant (person or company) with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Participant updated successfully",
                    content = @Content(schema = @Schema(implementation = ParticipantDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid participant details"),
            @ApiResponse(responseCode = "404", description = "Participant not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ParticipantDTO> updateParticipant(
            @Parameter(description = "ID of the participant to update", example = "1") @PathVariable Long id,
            @Valid @RequestBody @Schema(description = "Updated participant details") ParticipantDTO participantDTO) {
        Participant participantDetails = participantMapper.toEntity(participantDTO);
        Participant updatedParticipant = participantService.updateParticipant(id, participantDetails);
        return ResponseEntity.ok(participantMapper.toDto(updatedParticipant));
    }

    @Operation(summary = "Retrieve a participant by ID",
            description = "Fetches detailed information about a specific participant (person or company)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved participant",
                    content = @Content(schema = @Schema(implementation = ParticipantDTO.class))),
            @ApiResponse(responseCode = "404", description = "Participant not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ParticipantDTO> getParticipant(
            @Parameter(description = "ID of the participant to retrieve", example = "1")
            @PathVariable Long id) {
        Participant participant = participantService.getParticipantById(id);
        return ResponseEntity.ok(participantMapper.toDto(participant));
    }

    @Operation(summary = "Delete a participant", description = "Deletes a participant (person or company) by their ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Participant deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Participant not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParticipant(
            @Parameter(description = "ID of the participant to delete", example = "1") @PathVariable Long id) {
        participantService.deleteParticipant(id);
        return ResponseEntity.noContent().build();
    }
}