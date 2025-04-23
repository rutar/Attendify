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
        if (participant instanceof Person person) {
            validateEstonianPersonalCode(person.getPersonalCode());
            if (participantRepository.existsByPersonalCode(person.getPersonalCode())) {
                throw new DuplicateResourceException("Person with this personal code already exists");
            }
        } else if (participant instanceof Company company) {
            validateRegistrationCode(company.getRegistrationCode());
            if (participantRepository.existsByRegistrationCode(company.getRegistrationCode())) {
                throw new DuplicateResourceException("Company with this registration code already exists");
            }
            if (company.getParticipantCount() == null || company.getParticipantCount() < 1) {
                company.setParticipantCount(1);
            }
        } else {
            throw new IllegalArgumentException("Unknown participant type: " + participant.getClass().getName());
        }
        return participantRepository.save(participant);
    }

    @Override
    @Transactional
    public Participant updateParticipant(Long id, Participant participantDetails) {
        Participant participant = getParticipantById(id);

        // Проверяем, что тип участника совпадает
        if (participant.getClass() != participantDetails.getClass()) {
            throw new IllegalArgumentException("Participant type mismatch: cannot update " + participant.getClass().getSimpleName() +
                    " with " + participantDetails.getClass().getSimpleName());
        }

        // Обновляем общие поля
        participant.setPaymentMethod(participantDetails.getPaymentMethod());
        participant.setAdditionalInfo(participantDetails.getAdditionalInfo());

        // Обновляем специфичные поля и проверяем уникальность
        if (participant instanceof Person person && participantDetails instanceof Person personDetails) {
            if (!person.getPersonalCode().equals(personDetails.getPersonalCode()) &&
                    participantRepository.existsByPersonalCode(personDetails.getPersonalCode())) {
                throw new DuplicateResourceException("Person with this personal code already exists");
            }
            person.setFirstName(personDetails.getFirstName());
            person.setLastName(personDetails.getLastName());
            person.setPersonalCode(personDetails.getPersonalCode());
        } else if (participant instanceof Company company && participantDetails instanceof Company companyDetails) {
            if (!company.getRegistrationCode().equals(companyDetails.getRegistrationCode()) &&
                    participantRepository.existsByRegistrationCode(companyDetails.getRegistrationCode())) {
                throw new DuplicateResourceException("Company with this registration code already exists");
            }
            company.setCompanyName(companyDetails.getCompanyName());
            company.setRegistrationCode(companyDetails.getRegistrationCode());
            company.setParticipantCount(companyDetails.getParticipantCount());
            company.setContactPerson(companyDetails.getContactPerson());
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
    public Page<Participant> searchParticipants(String query, Pageable pageable) {
        return participantRepository.searchParticipants(query, pageable);
    }


    void validateEstonianPersonalCode(String personalCode) {
        // Validation of Estonian personal code
        if (!personalCode.matches("^[0-6]\\d{10}$")) {
            throw new IllegalArgumentException("Invalid Estonian personal code format");
        }

        // Additional validation: Checksum verification for Estonian personal code
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
        if (!registrationCode.matches("^\\d{8}$")) {
            throw new IllegalArgumentException("Invalid registration code format: must be 8 digits");
        }
    }
}