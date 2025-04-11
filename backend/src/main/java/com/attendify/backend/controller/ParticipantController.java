package com.attendify.backend.controller;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.dto.CompanyDTO;
import com.attendify.backend.dto.ParticipantTypeDTO;
import com.attendify.backend.dto.PersonDTO;
import com.attendify.backend.service.ParticipantService;
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
public class ParticipantController {
    private final ParticipantService participantService;
    private final ModelMapper modelMapper;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllParticipants() {
        List<Map<String, Object>> participantDTOs = participantService.getAllParticipants().stream()
                .map(participant -> {
                    Map<String, Object> participantMap = new HashMap<>();
                    participantMap.put("id", participant.getId());

                    if (participant instanceof Person) {
                        Person person = (Person) participant;
                        participantMap.put("type", "PERSON");
                        participantMap.put("firstName", person.getFirstName());
                        participantMap.put("lastName", person.getLastName());
                        participantMap.put("personalCode", person.getPersonalCode());
                    } else if (participant instanceof Company) {
                        Company company = (Company) participant;
                        participantMap.put("type", "COMPANY");
                        participantMap.put("companyName", company.getCompanyName());
                        participantMap.put("registrationCode", company.getRegistrationCode());
                        participantMap.put("participantCount", company.getParticipantCount());
                    }

                    participantMap.put("paymentMethod", participant.getPaymentMethod());
                    participantMap.put("additionalInfo", participant.getAdditionalInfo());

                    return participantMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(participantDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getParticipantById(@PathVariable Long id) {
        Participant participant = participantService.getParticipantById(id);
        Map<String, Object> participantMap = new HashMap<>();
        participantMap.put("id", participant.getId());

        if (participant instanceof Person) {
            Person person = (Person) participant;
            participantMap.put("type", "PERSON");
            participantMap.put("firstName", person.getFirstName());
            participantMap.put("lastName", person.getLastName());
            participantMap.put("personalCode", person.getPersonalCode());
        } else if (participant instanceof Company) {
            Company company = (Company) participant;
            participantMap.put("type", "COMPANY");
            participantMap.put("companyName", company.getCompanyName());
            participantMap.put("registrationCode", company.getRegistrationCode());
            participantMap.put("participantCount", company.getParticipantCount());
        }

        participantMap.put("paymentMethod", participant.getPaymentMethod());
        participantMap.put("additionalInfo", participant.getAdditionalInfo());

        return ResponseEntity.ok(participantMap);
    }

    @PostMapping("/type")
    public ResponseEntity<Map<String, Object>> fetchParticipantFormOptions(@Valid @RequestBody ParticipantTypeDTO typeDTO) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", typeDTO.getType());
        response.put("paymentMethods", Arrays.asList(Participant.PaymentMethod.values()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/persons")
    public ResponseEntity<PersonDTO> createPerson(@Valid @RequestBody PersonDTO personDTO) {
        Person person = modelMapper.map(personDTO, Person.class);
        Person createdPerson = participantService.createPerson(person);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(modelMapper.map(createdPerson, PersonDTO.class));
    }

    @PostMapping("/companies")
    public ResponseEntity<CompanyDTO> createCompany(@Valid @RequestBody CompanyDTO companyDTO) {
        Company company = modelMapper.map(companyDTO, Company.class);
        Company createdCompany = participantService.createCompany(company);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(modelMapper.map(createdCompany, CompanyDTO.class));
    }

    @PutMapping("/persons/{id}")
    public ResponseEntity<PersonDTO> updatePerson(
            @PathVariable Long id,
            @Valid @RequestBody PersonDTO personDTO) {
        Person personDetails = modelMapper.map(personDTO, Person.class);
        Person updatedPerson = participantService.updatePerson(id, personDetails);
        return ResponseEntity.ok(modelMapper.map(updatedPerson, PersonDTO.class));
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<CompanyDTO> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody CompanyDTO companyDTO) {
        Company companyDetails = modelMapper.map(companyDTO, Company.class);
        Company updatedCompany = participantService.updateCompany(id, companyDetails);
        return ResponseEntity.ok(modelMapper.map(updatedCompany, CompanyDTO.class));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParticipant(@PathVariable Long id) {
        participantService.deleteParticipant(id);
        return ResponseEntity.noContent().build();
    }
}