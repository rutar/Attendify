package com.attendify.backend.service;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;

import java.util.List;

public interface ParticipantService {
    List<Participant> getAllParticipants();
    Participant getParticipantById(Long id);
    Person createPerson(Person person);
    Company createCompany(Company company);
    Person updatePerson(Long id, Person personDetails);
    Company updateCompany(Long id, Company companyDetails);
    void deleteParticipant(Long id);
}