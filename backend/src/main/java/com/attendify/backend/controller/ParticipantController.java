package com.attendify.backend.controller;

import com.attendify.backend.domain.Participant;
import com.attendify.backend.repository.ParticipantRepository;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/participants")
public class ParticipantController {
    @Autowired
    private ParticipantRepository participantRepository;

    @GetMapping
    @Operation(summary = "Get all participants")
    public ResponseEntity<List<Participant>> getAllParticipants() {
        return ResponseEntity.ok(participantRepository.findAll());
    }

    @PostMapping
    @Operation(summary = "Create a new participant")
    public ResponseEntity<Participant> createParticipant(@RequestBody Participant participant) {
        Participant saved = participantRepository.save(participant);
        return ResponseEntity.status(201).body(saved);
    }
}