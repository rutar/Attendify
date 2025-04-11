package com.attendify.backend.controller;

import com.attendify.backend.domain.Participant;
import com.attendify.backend.service.ParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/participants")
public class ParticipantController {
    @Autowired
    private ParticipantService participantService;

    @GetMapping
    @Operation(summary = "Get all participants", description = "Retrieve a list of all participants")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved participants"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<Participant>> getAllParticipants() {
        List<Participant> participants = participantService.getAllParticipants();
        return ResponseEntity.ok(participants);
    }

    @PostMapping
    @Operation(summary = "Create a new participant", description = "Add a new participant to the system")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Participant created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid participant data")
    })
    public ResponseEntity<Participant> createParticipant(@Valid @RequestBody Participant participant) {
        Participant saved = participantService.createParticipant(participant);
        return ResponseEntity.status(201).body(saved);
    }
}