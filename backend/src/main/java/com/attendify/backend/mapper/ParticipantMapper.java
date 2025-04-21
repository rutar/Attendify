package com.attendify.backend.mapper;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.domain.Participant.PaymentMethod;
import com.attendify.backend.dto.ParticipantDTO;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ParticipantMapper {

    public ParticipantDTO toDto(Participant participant) {
        if (participant == null) return null;
        Participant unproxied = (Participant) Hibernate.unproxy(participant);

        ParticipantDTO dto = new ParticipantDTO();
        dto.setId(unproxied.getId());
        dto.setPaymentMethod(
                unproxied.getPaymentMethod() != null ? unproxied.getPaymentMethod().name() : null
        );
        dto.setAdditionalInfo(unproxied.getAdditionalInfo());

        if (unproxied instanceof Person person) {
            mapPerson(person, dto);
        } else if (unproxied instanceof Company company) {
            mapCompany(company, dto);
        } else {
            throw new IllegalArgumentException("Unknown participant type: " + unproxied.getClass().getName());
        }
        return dto;
    }

    // Alternative approach using Hibernate metadata
    public ParticipantDTO toDtoAlternative(Participant participant) {
        if (participant == null) return null;

        ParticipantDTO dto = new ParticipantDTO();
        dto.setId(participant.getId());
        dto.setPaymentMethod(participant.getPaymentMethod() != null ? participant.getPaymentMethod().name() : null);
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
        dto.setFirstName(person.getFirstName());
        dto.setLastName(person.getLastName());
        dto.setPersonalCode(person.getPersonalCode());
    }

    private void mapCompany(Company company, ParticipantDTO dto) {
        dto.setType("COMPANY");
        dto.setCompanyName(company.getCompanyName());
        dto.setRegistrationCode(company.getRegistrationCode());
        dto.setParticipantCount(company.getParticipantCount());
        dto.setContactPerson(company.getContactPerson());
    }

    public Participant toEntity(ParticipantDTO dto) {
        if (dto == null) return null;

        Participant participant;
        if ("PERSON".equals(dto.getType())) {
            Person person = new Person();
            person.setFirstName(dto.getFirstName());
            person.setLastName(dto.getLastName());
            person.setPersonalCode(dto.getPersonalCode());
            participant = person;
        } else if ("COMPANY".equals(dto.getType())) {
            Company company = new Company();
            company.setCompanyName(dto.getCompanyName());
            company.setRegistrationCode(dto.getRegistrationCode());
            company.setParticipantCount(dto.getParticipantCount());
            company.setContactPerson(dto.getContactPerson());
            participant = company;
        } else {
            throw new IllegalArgumentException("Unknown participant type: " + dto.getType());
        }

        participant.setId(dto.getId());
        participant.setPaymentMethod(dto.getPaymentMethod() != null ? PaymentMethod.valueOf(dto.getPaymentMethod()) : null);
        participant.setAdditionalInfo(dto.getAdditionalInfo());

        return participant;
    }
}