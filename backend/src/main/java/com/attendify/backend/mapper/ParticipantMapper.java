package com.attendify.backend.mapper;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.dto.CompanyDTO;
import com.attendify.backend.dto.ParticipantDTO;
import com.attendify.backend.dto.PersonDTO;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ParticipantMapper {

    public ParticipantDTO toDto(Participant participant) {
        if (participant == null) return null;

        // Unproxy the participant to get the actual entity class
        Participant unproxied = Hibernate.unproxy(participant, Participant.class);

        ParticipantDTO dto = new ParticipantDTO();
        dto.setId(unproxied.getId());
        dto.setPaymentMethod(unproxied.getPaymentMethod());
        dto.setAdditionalInfo(unproxied.getAdditionalInfo());

        if (unproxied instanceof Person) {
            mapPerson((Person) unproxied, dto);
        } else if (unproxied instanceof Company) {
            mapCompany((Company) unproxied, dto);
        } else {
            throw new IllegalArgumentException("Unknown participant type: "
                    + unproxied.getClass().getName());
        }
        return dto;
    }

    // Alternative approach using Hibernate metadata
    public ParticipantDTO toDtoAlternative(Participant participant) {
        if (participant == null) return null;

        ParticipantDTO dto = new ParticipantDTO();
        dto.setId(participant.getId());
        dto.setPaymentMethod(participant.getPaymentMethod());
        dto.setAdditionalInfo(participant.getAdditionalInfo());

        // Check the underlying Hibernate type
        if (isPerson(participant)) {
            mapPerson((Person) Hibernate.unproxy(participant), dto);
        } else if (isCompany(participant)) {
            mapCompany((Company) Hibernate.unproxy(participant), dto);
        } else {
            throw new IllegalArgumentException("Unknown participant type");
        }
        return dto;
    }

    private boolean isPerson(Participant participant) {
        return Hibernate.getClass(participant) == Person.class;
    }

    private boolean isCompany(Participant participant) {
        return Hibernate.getClass(participant) == Company.class;
    }

    private void mapPerson(Person person, ParticipantDTO dto) {
        dto.setType("PERSON");
        dto.setName(person.getFirstName() + " " + person.getLastName());
        dto.setCode(person.getPersonalCode());
        dto.setEmail(person.getEmail());
        dto.setPhone(person.getPhone());
    }

    private void mapCompany(Company company, ParticipantDTO dto) {
        dto.setType("COMPANY");
        dto.setName(company.getCompanyName());
        dto.setCode(company.getRegistrationCode());
        dto.setParticipantCount(company.getParticipantCount());
        dto.setContactPerson(company.getContactPerson());
        dto.setEmail(company.getEmail());
        dto.setPhone(company.getPhone());
    }

    public Person personDtoToPerson(PersonDTO dto) {
        Person person = new Person();
        person.setId(dto.getId());
        person.setFirstName(dto.getFirstName());
        person.setLastName(dto.getLastName());
        person.setPersonalCode(dto.getPersonalCode());
        person.setPaymentMethod(dto.getPaymentMethod());
        person.setAdditionalInfo(dto.getAdditionalInfo());
        return person;
    }

    public PersonDTO personToPersonDto(Person person) {
        PersonDTO dto = new PersonDTO();
        dto.setId(person.getId());
        dto.setFirstName(person.getFirstName());
        dto.setLastName(person.getLastName());
        dto.setPersonalCode(person.getPersonalCode());
        dto.setPaymentMethod(person.getPaymentMethod());
        dto.setAdditionalInfo(person.getAdditionalInfo());
        return dto;
    }

    public Company companyDtoToCompany(CompanyDTO dto) {
        Company company = new Company();
        company.setId(dto.getId());
        company.setCompanyName(dto.getCompanyName());
        company.setRegistrationCode(dto.getRegistrationCode());
        company.setParticipantCount(dto.getParticipantCount());
        company.setPaymentMethod(dto.getPaymentMethod());
        company.setAdditionalInfo(dto.getAdditionalInfo());
        return company;
    }

    public CompanyDTO companyToCompanyDto(Company company) {
        CompanyDTO dto = new CompanyDTO();
        dto.setId(company.getId());
        dto.setCompanyName(company.getCompanyName());
        dto.setRegistrationCode(company.getRegistrationCode());
        dto.setParticipantCount(company.getParticipantCount());
        dto.setPaymentMethod(company.getPaymentMethod());
        dto.setAdditionalInfo(company.getAdditionalInfo());
        return dto;
    }
}