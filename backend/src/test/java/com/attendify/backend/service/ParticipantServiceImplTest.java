package com.attendify.backend.service;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.exception.DuplicateResourceException;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.CompanyRepository;
import com.attendify.backend.repository.ParticipantRepository;
import com.attendify.backend.repository.PersonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantServiceImplTest {

    @Mock
    private ParticipantRepository participantRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private ParticipantServiceImpl participantService;

    private Person person;
    private Company company;

    @BeforeEach
    void setUp() {
        person = new Person();
        person.setId(1L);
        person.setFirstName("John");
        person.setLastName("Doe");
        person.setPersonalCode("38001150120");
        person.setPaymentMethod(Participant.PaymentMethod.BANK_TRANSFER);
        person.setAdditionalInfo("VIP guest");

        company = new Company();
        company.setId(2L);
        company.setCompanyName("Test Company");
        company.setRegistrationCode("12345678");
        company.setParticipantCount(5);
        company.setPaymentMethod(Participant.PaymentMethod.CARD);
        company.setAdditionalInfo("Gold sponsor");
    }

    @Test
    void getAllParticipants_ShouldReturnAllParticipants() {
        // Arrange
        List<Participant> expectedParticipants = Arrays.asList(person, company);
        when(participantRepository.findAll()).thenReturn(expectedParticipants);

        // Act
        List<Participant> actualParticipants = participantService.getAllParticipants();

        // Assert
        assertEquals(expectedParticipants, actualParticipants);
        verify(participantRepository, times(1)).findAll();
    }

    @Test
    void getParticipantById_WhenParticipantExists_ShouldReturnParticipant() {
        // Arrange
        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));

        // Act
        Participant result = participantService.getParticipantById(1L);

        // Assert
        assertEquals(person, result);
        verify(participantRepository, times(1)).findById(1L);
    }

    @Test
    void getParticipantById_WhenParticipantNotExists_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(participantRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> participantService.getParticipantById(99L));
        verify(participantRepository, times(1)).findById(99L);
    }

    @Test
    void createPerson_WithValidData_ShouldSaveAndReturnPerson() {
        // Arrange
        when(personRepository.existsByPersonalCode(person.getPersonalCode())).thenReturn(false);
        when(personRepository.save(person)).thenReturn(person);

        // Act
        Person result = participantService.createPerson(person);

        // Assert
        assertEquals(person, result);
        verify(personRepository, times(1)).existsByPersonalCode(person.getPersonalCode());
        verify(personRepository, times(1)).save(person);
    }

    @Test
    void createPerson_WithDuplicatePersonalCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        when(personRepository.existsByPersonalCode(person.getPersonalCode())).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.createPerson(person));
        verify(personRepository, times(1)).existsByPersonalCode(person.getPersonalCode());
        verify(personRepository, never()).save(any());
    }

    @Test
    void createPerson_WithInvalidPersonalCode_ShouldThrowIllegalArgumentException() {
        // Arrange
        person.setPersonalCode("12345678901"); // Invalid personal code

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.createPerson(person));
        verify(personRepository, never()).existsByPersonalCode(any());
        verify(personRepository, never()).save(any());
    }

    @Test
    void createCompany_WithValidData_ShouldSaveAndReturnCompany() {
        // Arrange
        when(companyRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(false);
        when(companyRepository.save(company)).thenReturn(company);

        // Act
        Company result = participantService.createCompany(company);

        // Assert
        assertEquals(company, result);
        verify(companyRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(companyRepository, times(1)).save(company);
    }

    @Test
    void createCompany_WithDuplicateRegistrationCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        when(companyRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.createCompany(company));
        verify(companyRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(companyRepository, never()).save(any());
    }

    @Test
    void createCompany_WithNullParticipantCount_ShouldSetDefaultValue() {
        // Arrange
        company.setParticipantCount(null);
        when(companyRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Company result = participantService.createCompany(company);

        // Assert
        assertEquals(1, result.getParticipantCount());
        verify(companyRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(companyRepository, times(1)).save(any(Company.class));
    }

    @Test
    void createCompany_WithZeroParticipantCount_ShouldSetDefaultValue() {
        // Arrange
        company.setParticipantCount(0);
        when(companyRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Company result = participantService.createCompany(company);

        // Assert
        assertEquals(1, result.getParticipantCount());
        verify(companyRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(companyRepository, times(1)).save(any(Company.class));
    }

    @Test
    void updatePerson_WithValidData_ShouldUpdateAndReturnPerson() {
        // Arrange
        Person updatedPerson = new Person();
        updatedPerson.setFirstName("Updated");
        updatedPerson.setLastName("Name");
        updatedPerson.setPersonalCode("39506070819"); // Same personal code
        updatedPerson.setPaymentMethod(Participant.PaymentMethod.CASH);
        updatedPerson.setAdditionalInfo("Updated info");

        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));
        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Person result = participantService.updatePerson(1L, updatedPerson);

        // Assert
        assertEquals("Updated", result.getFirstName());
        assertEquals("Name", result.getLastName());
        assertEquals(Participant.PaymentMethod.CASH, result.getPaymentMethod());
        assertEquals("Updated info", result.getAdditionalInfo());
        verify(participantRepository, times(1)).findById(1L);
        verify(personRepository, times(1)).save(any(Person.class));
    }

    @Test
    void updatePerson_WithChangedDuplicatePersonalCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        Person updatedPerson = new Person();
        updatedPerson.setPersonalCode("49506070819"); // Different personal code

        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));
        when(personRepository.existsByPersonalCode(updatedPerson.getPersonalCode())).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.updatePerson(1L, updatedPerson));
        verify(participantRepository, times(1)).findById(1L);
        verify(personRepository, times(1)).existsByPersonalCode(updatedPerson.getPersonalCode());
        verify(personRepository, never()).save(any());
    }

    @Test
    void updatePerson_WhenParticipantIsNotPerson_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.updatePerson(2L, person));
        verify(participantRepository, times(1)).findById(2L);
        verify(personRepository, never()).save(any());
    }

    @Test
    void updateCompany_WithValidData_ShouldUpdateAndReturnCompany() {
        // Arrange
        Company updatedCompany = new Company();
        updatedCompany.setCompanyName("Updated Company");
        updatedCompany.setRegistrationCode("12345678"); // Same registration code
        updatedCompany.setParticipantCount(10);
        updatedCompany.setPaymentMethod(Participant.PaymentMethod.CARD);
        updatedCompany.setAdditionalInfo("Updated info");

        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Company result = participantService.updateCompany(2L, updatedCompany);

        // Assert
        assertEquals("Updated Company", result.getCompanyName());
        assertEquals(10, result.getParticipantCount());
        assertEquals(Participant.PaymentMethod.CARD, result.getPaymentMethod());
        assertEquals("Updated info", result.getAdditionalInfo());
        verify(participantRepository, times(1)).findById(2L);
        verify(companyRepository, times(1)).save(any(Company.class));
    }

    @Test
    void updateCompany_WithChangedDuplicateRegistrationCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        Company updatedCompany = new Company();
        updatedCompany.setRegistrationCode("87654321"); // Different registration code

        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));
        when(companyRepository.existsByRegistrationCode(updatedCompany.getRegistrationCode())).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.updateCompany(2L, updatedCompany));
        verify(participantRepository, times(1)).findById(2L);
        verify(companyRepository, times(1)).existsByRegistrationCode(updatedCompany.getRegistrationCode());
        verify(companyRepository, never()).save(any());
    }

    @Test
    void updateCompany_WhenParticipantIsNotCompany_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.updateCompany(1L, company));
        verify(participantRepository, times(1)).findById(1L);
        verify(companyRepository, never()).save(any());
    }

    @Test
    void deleteParticipant_WhenParticipantExists_ShouldDeleteParticipant() {
        // Arrange
        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));

        // Act
        participantService.deleteParticipant(1L);

        // Assert
        verify(participantRepository, times(1)).findById(1L);
        verify(participantRepository, times(1)).delete(person);
    }

    @Test
    void deleteParticipant_WhenParticipantNotExists_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(participantRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> participantService.deleteParticipant(99L));
        verify(participantRepository, times(1)).findById(99L);
        verify(participantRepository, never()).delete(any());
    }

    @Test
    void validateEstonianPersonalCode_WithValidCode_ShouldNotThrowException() {
        // Valid personal codes
        assertDoesNotThrow(() -> participantService.validateEstonianPersonalCode("60503123450"));
        assertDoesNotThrow(() -> participantService.validateEstonianPersonalCode("50002299877"));
    }

    @Test
    void validateEstonianPersonalCode_WithInvalidFormat_ShouldThrowIllegalArgumentException() {
        // Invalid formats
        assertThrows(IllegalArgumentException.class, () -> participantService.validateEstonianPersonalCode("123"));
        assertThrows(IllegalArgumentException.class, () -> participantService.validateEstonianPersonalCode("3950607081"));
        assertThrows(IllegalArgumentException.class, () -> participantService.validateEstonianPersonalCode("79506070819"));
        assertThrows(IllegalArgumentException.class, () -> participantService.validateEstonianPersonalCode("3950607081a"));
    }

    @Test
    void validateEstonianPersonalCode_WithInvalidChecksum_ShouldThrowIllegalArgumentException() {
        // Valid format but invalid checksum
        assertThrows(IllegalArgumentException.class, () -> participantService.validateEstonianPersonalCode("39506070810"));
    }
}