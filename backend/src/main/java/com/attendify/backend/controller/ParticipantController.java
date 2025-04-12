package com.attendify.backend.controller;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.dto.CompanyDTO;
import com.attendify.backend.dto.ParticipantTypeDTO;
import com.attendify.backend.dto.PersonDTO;
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
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
@Tag(name = "Participant Management", description = "APIs for managing participants (persons and companies).")
public class ParticipantController {
    private final ParticipantService participantService;
    private final ModelMapper modelMapper;

    private static Map<String, Object> applyParticipant(Participant participant) {
        Map<String, Object> participantMap = new HashMap<>();
        participantMap.put("id", participant.getId());

        if (participant instanceof Person person) {
            participantMap.put("type", "PERSON");
            participantMap.put("firstName", person.getFirstName());
            participantMap.put("lastName", person.getLastName());
            participantMap.put("personalCode", person.getPersonalCode());
        } else if (participant instanceof Company company) {
            participantMap.put("type", "COMPANY");
            participantMap.put("companyName", company.getCompanyName());
            participantMap.put("registrationCode", company.getRegistrationCode());
            participantMap.put("participantCount", company.getParticipantCount());
        }

        participantMap.put("paymentMethod", participant.getPaymentMethod());
        participantMap.put("additionalInfo", participant.getAdditionalInfo());

        return participantMap;
    }

    @Operation(summary = "Retrieve all participants", description = "Fetches a list of all participants, including both persons and companies.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved participants",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllParticipants() {
        List<Map<String, Object>> participantDTOs = participantService.getAllParticipants().stream()
                .map(ParticipantController::applyParticipant)
                .collect(Collectors.toList());

        return ResponseEntity.ok(participantDTOs);
    }

    @Operation(summary = "Retrieve a participant by ID", description = "Fetches details of a specific participant (person or company) by their ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved participant",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "404", description = "Participant not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getParticipantById(
            @Parameter(description = "ID of the participant to retrieve", example = "1") @PathVariable Long id) {
        Participant participant = participantService.getParticipantById(id);
        Map<String, Object> participantMap = applyParticipant(participant);

        return ResponseEntity.ok(participantMap);
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
        Person person = modelMapper.map(personDTO, Person.class);
        Person createdPerson = participantService.createPerson(person);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(modelMapper.map(createdPerson, PersonDTO.class));
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
        Company company = modelMapper.map(companyDTO, Company.class);
        Company createdCompany = participantService.createCompany(company);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(modelMapper.map(createdCompany, CompanyDTO.class));
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
        Person personDetails = modelMapper.map(personDTO, Person.class);
        Person updatedPerson = participantService.updatePerson(id, personDetails);
        return ResponseEntity.ok(modelMapper.map(updatedPerson, PersonDTO.class));
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
        Company companyDetails = modelMapper.map(companyDTO, Company.class);
        Company updatedCompany = participantService.updateCompany(id, companyDetails);
        return ResponseEntity.ok(modelMapper.map(updatedCompany, CompanyDTO.class));
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