package com.attendify.backend.controller;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.dto.CompanyDTO;
import com.attendify.backend.dto.ParticipantDTO;
import com.attendify.backend.dto.ParticipantTypeDTO;
import com.attendify.backend.dto.PersonDTO;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
@Tag(name = "Participant Management", description = "APIs for managing participants (persons and companies).")
public class ParticipantController {
    private final ParticipantService participantService;
    private final ParticipantMapper participantMapper;

    @Operation(summary = "Retrieve all participants", description = "Fetches a list of all participants, including both persons and companies.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved participants",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping
    public ResponseEntity<List<ParticipantDTO>> getAllParticipants() {
        List<ParticipantDTO> participantDTOs = participantService.getAllParticipants().stream()
                .map(participantMapper::toDto)
                .toList();
        return ResponseEntity.ok(participantDTOs);
    }

    @Operation(summary = "Fetch participant form options", description = "Returns available participant types and payment methods based on the provided type.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved form options",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "400", description = "Invalid participant type")
    })
    @PostMapping("/type")
    public ResponseEntity<Map<String, Object>> fetchParticipantFormOptions(
            @Valid @RequestBody @Schema(description = "Participant type details") ParticipantTypeDTO typeDTO) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", typeDTO.getType());
        response.put("paymentMethods", Arrays.asList(Participant.PaymentMethod.values()));
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create a new person", description = "Creates a new person participant with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Person created successfully",
                    content = @Content(schema = @Schema(implementation = PersonDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid person details")
    })
    @PostMapping("/persons")
    public ResponseEntity<PersonDTO> createPerson(
            @Valid @RequestBody @Schema(description = "Person details") PersonDTO personDTO) {
        Person person = participantMapper.personDtoToPerson(personDTO);
        Person createdPerson = participantService.createPerson(person);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(participantMapper.personToPersonDto(createdPerson));
    }

    @Operation(summary = "Create a new company", description = "Creates a new company participant with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Company created successfully",
                    content = @Content(schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid company details")
    })
    @PostMapping("/companies")
    public ResponseEntity<CompanyDTO> createCompany(
            @Valid @RequestBody @Schema(description = "Company details") CompanyDTO companyDTO) {
        Company company = participantMapper.companyDtoToCompany(companyDTO);
        Company createdCompany = participantService.createCompany(company);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(participantMapper.companyToCompanyDto(createdCompany));
    }

    @Operation(summary = "Update a person", description = "Updates an existing person participant with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Person updated successfully",
                    content = @Content(schema = @Schema(implementation = PersonDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid person details"),
            @ApiResponse(responseCode = "404", description = "Person not found")
    })
    @PutMapping("/persons/{id}")
    public ResponseEntity<PersonDTO> updatePerson(
            @Parameter(description = "ID of the person to update", example = "1") @PathVariable Long id,
            @Valid @RequestBody @Schema(description = "Updated person details") PersonDTO personDTO) {
        Person personDetails = participantMapper.personDtoToPerson(personDTO);
        Person updatedPerson = participantService.updatePerson(id, personDetails);
        return ResponseEntity.ok(participantMapper.personToPersonDto(updatedPerson));
    }

    @Operation(summary = "Update a company", description = "Updates an existing company participant with the provided details.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Company updated successfully",
                    content = @Content(schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid company details"),
            @ApiResponse(responseCode = "404", description = "Company not found")
    })
    @PutMapping("/companies/{id}")
    public ResponseEntity<CompanyDTO> updateCompany(
            @Parameter(description = "ID of the company to update", example = "1") @PathVariable Long id,
            @Valid @RequestBody @Schema(description = "Updated company details") CompanyDTO companyDTO) {
        Company companyDetails = participantMapper.companyDtoToCompany(companyDTO);
        Company updatedCompany = participantService.updateCompany(id, companyDetails);
        return ResponseEntity.ok(participantMapper.companyToCompanyDto(updatedCompany));
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