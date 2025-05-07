package com.attendify.backend.service;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.exception.DuplicateResourceException;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ParticipantServiceImpl implements ParticipantService {
    private final ParticipantRepository participantRepository;

    private static final int PERSON_ADDITIONAL_INFO_MAX_LENGTH = 1000;
    private static final int COMPANY_ADDITIONAL_INFO_MAX_LENGTH = 5000;

    @Override
    public Page<Participant> getAllParticipants(Pageable pageable) {
        return participantRepository.findAll(pageable);
    }

    @Override
    public Participant getParticipantById(Long id) {
        return participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + id));
    }

    @Override
    @Transactional
    public Participant createParticipant(Participant participant) {
        switch (participant) {
            case null -> throw new IllegalArgumentException("Participant cannot be null");
            case Person person -> {
                validateEstonianPersonalCode(person.getPersonalCode());
                validateAdditionalInfoLength(person.getAdditionalInfo(), PERSON_ADDITIONAL_INFO_MAX_LENGTH, "Person");
                if (participantRepository.existsByPersonalCode(person.getPersonalCode())) {
                    throw new DuplicateResourceException("Person with this personal code already exists");
                }
            }
            case Company company -> {
                validateRegistrationCode(company.getRegistrationCode());
                validateAdditionalInfoLength(company.getAdditionalInfo(), COMPANY_ADDITIONAL_INFO_MAX_LENGTH, "Company");
                if (participantRepository.existsByRegistrationCode(company.getRegistrationCode())) {
                    throw new DuplicateResourceException("Company with this registration code already exists");
                }
                if (company.getParticipantCount() == null || company.getParticipantCount() < 1) {
                    company.setParticipantCount(1);
                }
            }
            default ->
                    throw new IllegalArgumentException("Unknown participant type: " + participant.getClass().getName());
        }
        return participantRepository.save(participant);
    }

    @Override
    @Transactional
    public Participant updateParticipant(Long id, Participant participantDetails) {
        if (participantDetails == null) {
            throw new IllegalArgumentException("Participant details cannot be null");
        }
        Participant participant = getParticipantById(id);

        if (participant.getClass() != participantDetails.getClass()) {
            throw new IllegalArgumentException("Participant type mismatch: cannot update " + participant.getClass().getSimpleName() +
                    " with " + participantDetails.getClass().getSimpleName());
        }

        participant.setPaymentMethod(participantDetails.getPaymentMethod());
        if (participant instanceof Person) {
            validateAdditionalInfoLength(participantDetails.getAdditionalInfo(), PERSON_ADDITIONAL_INFO_MAX_LENGTH, "Person");
        } else if (participant instanceof Company) {
            validateAdditionalInfoLength(participantDetails.getAdditionalInfo(), COMPANY_ADDITIONAL_INFO_MAX_LENGTH, "Company");
        }
        participant.setAdditionalInfo(participantDetails.getAdditionalInfo());

        if (participant instanceof Person person && participantDetails instanceof Person personDetails) {
            validateEstonianPersonalCode(personDetails.getPersonalCode());
            if (!person.getPersonalCode().equals(personDetails.getPersonalCode()) &&
                    participantRepository.existsByPersonalCode(personDetails.getPersonalCode())) {
                throw new DuplicateResourceException("Person with this personal code already exists");
            }
            person.setFirstName(personDetails.getFirstName());
            person.setLastName(personDetails.getLastName());
            person.setPersonalCode(personDetails.getPersonalCode());
            person.setEmail(personDetails.getEmail());
            person.setPhone(personDetails.getPhone());
        } else if (participant instanceof Company company && participantDetails instanceof Company companyDetails) {
            validateRegistrationCode(companyDetails.getRegistrationCode());
            if (!company.getRegistrationCode().equals(companyDetails.getRegistrationCode()) &&
                    participantRepository.existsByRegistrationCode(companyDetails.getRegistrationCode())) {
                throw new DuplicateResourceException("Company with this registration code already exists");
            }
            company.setCompanyName(companyDetails.getCompanyName());
            company.setRegistrationCode(companyDetails.getRegistrationCode());
            company.setParticipantCount(companyDetails.getParticipantCount());
            company.setContactPerson(companyDetails.getContactPerson());
            company.setEmail(companyDetails.getEmail());
            company.setPhone(companyDetails.getPhone());
        }

        return participantRepository.save(participant);
    }

    @Override
    @Transactional
    public void deleteParticipant(Long id) {
        Participant participant = getParticipantById(id);
        participantRepository.delete(participant);
    }

    @Override
    public Page<Participant> searchParticipants(String query, String type, String field, Pageable pageable) {
        if (query == null || query.isEmpty()) {
            return participantRepository.findAll(pageable);
        }

        type = type == null ? "" : type.toLowerCase();
        field = field == null ? "" : field.toLowerCase();

        return switch (type) {
            case "person" -> participantRepository.searchPersonsByField(query, field, pageable);
            case "company" -> participantRepository.searchCompaniesByField(query, field, pageable);
            default -> participantRepository.searchParticipantsByField(query, field, pageable);
        };
    }

    void validateEstonianPersonalCode(String personalCode) {
        if (personalCode == null) {
            throw new IllegalArgumentException("Personal code cannot be null");
        }
        if (!personalCode.matches("^[0-6]\\d{10}$")) {
            throw new IllegalArgumentException("Invalid Estonian personal code format");
        }

        int[] weights1 = {1, 2, 3, 4, 5, 6, 7, 8, 9, 1};
        int[] weights2 = {3, 4, 5, 6, 7, 8, 9, 1, 2, 3};
        int sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += Character.getNumericValue(personalCode.charAt(i)) * weights1[i];
        }
        int checksum = sum % 11;
        if (checksum == 10) {
            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += Character.getNumericValue(personalCode.charAt(i)) * weights2[i];
            }
            checksum = sum % 11;
            if (checksum == 10) {
                checksum = 0;
            }
        }
        int expectedChecksum = Character.getNumericValue(personalCode.charAt(10));
        if (checksum != expectedChecksum) {
            throw new IllegalArgumentException("Invalid Estonian personal code checksum");
        }
    }

    void validateRegistrationCode(String registrationCode) {
        if (registrationCode == null) {
            throw new IllegalArgumentException("Registration code cannot be null");
        }
        if (!registrationCode.matches("^\\d{8}$")) {
            throw new IllegalArgumentException("Invalid registration code format: must be 8 digits");
        }
    }

    private void validateAdditionalInfoLength(String additionalInfo, int maxLength, String participantType) {
        if (additionalInfo != null && additionalInfo.length() > maxLength) {
            throw new IllegalArgumentException(participantType + " additional info exceeds maximum length of " + maxLength + " characters");
        }
    }
}