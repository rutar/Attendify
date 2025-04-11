package com.attendify.backend.controller;

import com.attendify.backend.domain.Event;
import com.attendify.backend.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    @Autowired
    private EventService eventService;

    @GetMapping
    @Operation(summary = "Get all events", description = "Retrieve a list of all events in the system")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved events"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<Event>> getAllEvents() {
        List<Event> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    @PostMapping
    @Operation(summary = "Create a new event", description = "Add a new event to the system")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Event created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid event data")
    })
    public ResponseEntity<Event> createEvent(@Valid @RequestBody Event event) {
        Event savedEvent = eventService.createEvent(event);
        return ResponseEntity.status(201).body(savedEvent);
    }
}