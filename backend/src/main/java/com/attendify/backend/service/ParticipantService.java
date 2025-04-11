package com.attendify.backend.service;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.exception.DuplicateResourceException;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.CompanyRepository;
import com.attendify.backend.repository.ParticipantRepository;
import com.attendify.backend.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipantService {
    private final ParticipantRepository participantRepository;
    private final PersonRepository personRepository;
    private final CompanyRepository companyRepository;

    public List<Participant> getAllParticipants() {
        return participantRepository.findAll();
    }

    public Participant getParticipantById(Long id) {
        return participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + id));
    }

    @Transactional
    public Person createPerson(Person person) {
        validateEstonianPersonalCode(person.getPersonalCode());
        if (personRepository.existsByPersonalCode(person.getPersonalCode())) {
            throw new DuplicateResourceException("Person with this personal code already exists");
        }
        return personRepository.save(person);
    }

    @Transactional
    public Company createCompany(Company company) {
        if (companyRepository.existsByRegistrationCode(company.getRegistrationCode())) {
            throw new DuplicateResourceException("Company with this registration code already exists");
        }
        if (company.getParticipantCount() == null || company.getParticipantCount() < 1) {
            company.setParticipantCount(1);
        }
        return companyRepository.save(company);
    }

    @Transactional
    public Person updatePerson(Long id, Person personDetails) {
        Participant participant = getParticipantById(id);
        if (!(participant instanceof Person)) {
            throw new IllegalArgumentException("Participant with id " + id + " is not a Person");
        }
        Person person = (Person) participant;
        if (!person.getPersonalCode().equals(personDetails.getPersonalCode()) &&
                personRepository.existsByPersonalCode(personDetails.getPersonalCode())) {
            throw new DuplicateResourceException("Person with this personal code already exists");
        }
        person.setFirstName(personDetails.getFirstName());
        person.setLastName(personDetails.getLastName());
        person.setPersonalCode(personDetails.getPersonalCode());
        person.setPaymentMethod(personDetails.getPaymentMethod());
        person.setAdditionalInfo(personDetails.getAdditionalInfo());
        return personRepository.save(person);
    }

    @Transactional
    public Company updateCompany(Long id, Company companyDetails) {
        Participant participant = getParticipantById(id);
        if (!(participant instanceof Company)) {
            throw new IllegalArgumentException("Participant with id " + id + " is not a Company");
        }
        Company company = (Company) participant;
        if (!company.getRegistrationCode().equals(companyDetails.getRegistrationCode()) &&
                companyRepository.existsByRegistrationCode(companyDetails.getRegistrationCode())) {
            throw new DuplicateResourceException("Company with this registration code already exists");
        }
        company.setCompanyName(companyDetails.getCompanyName());
        company.setRegistrationCode(companyDetails.getRegistrationCode());
        company.setParticipantCount(companyDetails.getParticipantCount());
        company.setPaymentMethod(companyDetails.getPaymentMethod());
        company.setAdditionalInfo(companyDetails.getAdditionalInfo());
        return companyRepository.save(company);
    }

    @Transactional
    public void deleteParticipant(Long id) {
        Participant participant = getParticipantById(id);
        participantRepository.delete(participant);
    }

    private void validateEstonianPersonalCode(String personalCode) {
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
}