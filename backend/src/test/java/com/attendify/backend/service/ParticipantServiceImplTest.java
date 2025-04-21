package com.attendify.backend.service;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.exception.DuplicateResourceException;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.ParticipantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantServiceImplTest {

    @Mock
    private ParticipantRepository participantRepository;

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
        person.setEmail("john.doe@example.com");
        person.setPhone("+37255512345");

        company = new Company();
        company.setId(2L);
        company.setCompanyName("Test Company");
        company.setRegistrationCode("12345678");
        company.setParticipantCount(5);
        company.setPaymentMethod(Participant.PaymentMethod.CARD);
        company.setAdditionalInfo("Gold sponsor");
        company.setEmail("info@testcompany.com");
        company.setPhone("+37255598765");
    }

    @Test
    void searchParticipants_ShouldReturnPageOfParticipants() {
        // Arrange
        String query = "";
        Pageable pageable = PageRequest.of(0, 10); // page number, page size
        Page<Participant> expectedPage = new PageImpl<>(Arrays.asList(person, company));
        when(participantRepository.searchParticipants(query, pageable)).thenReturn(expectedPage);

        // Act
        Page<Participant> resultPage = participantService.searchParticipants(query, pageable);

        // Assert
        assertEquals(expectedPage, resultPage);
        verify(participantRepository, times(1)).searchParticipants(query, pageable);
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
    void createParticipant_WithValidPerson_ShouldSaveAndReturnPerson() {
        // Arrange
        when(participantRepository.existsByPersonalCode(person.getPersonalCode())).thenReturn(false);
        when(participantRepository.save(person)).thenReturn(person);

        // Act
        Participant result = participantService.createParticipant(person);

        // Assert
        assertEquals(person, result);
        verify(participantRepository, times(1)).existsByPersonalCode(person.getPersonalCode());
        verify(participantRepository, times(1)).save(person);
    }

    @Test
    void createParticipant_WithDuplicatePersonalCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        when(participantRepository.existsByPersonalCode(person.getPersonalCode())).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.createParticipant(person));
        verify(participantRepository, times(1)).existsByPersonalCode(person.getPersonalCode());
        verify(participantRepository, never()).save(any());
    }

    @Test
    void createParticipant_WithInvalidPersonalCode_ShouldThrowIllegalArgumentException() {
        // Arrange
        person.setPersonalCode("12345678901"); // Invalid personal code

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.createParticipant(person));
        verify(participantRepository, never()).existsByPersonalCode(any());
        verify(participantRepository, never()).save(any());
    }

    @Test
    void createParticipant_WithValidCompany_ShouldSaveAndReturnCompany() {
        // Arrange
        when(participantRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(false);
        when(participantRepository.save(company)).thenReturn(company);

        // Act
        Participant result = participantService.createParticipant(company);

        // Assert
        assertEquals(company, result);
        verify(participantRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(participantRepository, times(1)).save(company);
    }

    @Test
    void createParticipant_WithDuplicateRegistrationCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        when(participantRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.createParticipant(company));
        verify(participantRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(participantRepository, never()).save(any());
    }

    @Test
    void createParticipant_WithInvalidRegistrationCode_ShouldThrowIllegalArgumentException() {
        // Arrange
        company.setRegistrationCode("12345"); // Invalid registration code (not 8 digits)

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.createParticipant(company));
        verify(participantRepository, never()).existsByRegistrationCode(any());
        verify(participantRepository, never()).save(any());
    }

    @Test
    void createParticipant_WithNullParticipantCount_ShouldSetDefaultValue() {
        // Arrange
        company.setParticipantCount(null);
        when(participantRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(false);
        when(participantRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Participant result = participantService.createParticipant(company);

        // Assert
        assertEquals(1, ((Company) result).getParticipantCount());
        verify(participantRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(participantRepository, times(1)).save(any(Company.class));
    }

    @Test
    void createParticipant_WithZeroParticipantCount_ShouldSetDefaultValue() {
        // Arrange
        company.setParticipantCount(0);
        when(participantRepository.existsByRegistrationCode(company.getRegistrationCode())).thenReturn(false);
        when(participantRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Participant result = participantService.createParticipant(company);

        // Assert
        assertEquals(1, ((Company) result).getParticipantCount());
        verify(participantRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(participantRepository, times(1)).save(any(Company.class));
    }

    @Test
    void updateParticipant_WithValidPerson_ShouldUpdateAndReturnPerson() {
        // Arrange
        Person updatedPerson = new Person();
        updatedPerson.setFirstName("Updated");
        updatedPerson.setLastName("Name");
        updatedPerson.setPersonalCode("39506070819"); // Different valid personal code
        updatedPerson.setPaymentMethod(Participant.PaymentMethod.CASH);
        updatedPerson.setAdditionalInfo("Updated info");
        updatedPerson.setEmail("updated.doe@example.com");
        updatedPerson.setPhone("+37255567890");

        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));
        when(participantRepository.existsByPersonalCode("39506070819")).thenReturn(false);
        when(participantRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Participant result = participantService.updateParticipant(1L, updatedPerson);

        // Assert
        assertEquals("Updated", ((Person) result).getFirstName());
        assertEquals("Name", ((Person) result).getLastName());
        assertEquals("39506070819", ((Person) result).getPersonalCode());
        assertEquals(Participant.PaymentMethod.CASH, result.getPaymentMethod());
        assertEquals("Updated info", result.getAdditionalInfo());

        verify(participantRepository, times(1)).findById(1L);
        verify(participantRepository, times(1)).existsByPersonalCode("39506070819");
        verify(participantRepository, times(1)).save(any(Person.class));
    }

    @Test
    void updateParticipant_WithChangedDuplicatePersonalCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        Person updatedPerson = new Person();
        updatedPerson.setPersonalCode("49506070819"); // Different personal code

        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));
        when(participantRepository.existsByPersonalCode("49506070819")).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.updateParticipant(1L, updatedPerson));
        verify(participantRepository, times(1)).findById(1L);
        verify(participantRepository, times(1)).existsByPersonalCode("49506070819");
        verify(participantRepository, never()).save(any());
    }

    @Test
    void updateParticipant_WhenParticipantTypeMismatchForPerson_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.updateParticipant(2L, person));
        verify(participantRepository, times(1)).findById(2L);
        verify(participantRepository, never()).save(any());
    }

    @Test
    void updateParticipant_WithValidCompany_ShouldUpdateAndReturnCompany() {
        // Arrange
        Company updatedCompany = new Company();
        updatedCompany.setCompanyName("Updated Company");
        updatedCompany.setRegistrationCode("87654321"); // Different registration code
        updatedCompany.setParticipantCount(10);
        updatedCompany.setContactPerson("Updated Contact");
        updatedCompany.setPaymentMethod(Participant.PaymentMethod.BANK_TRANSFER);
        updatedCompany.setAdditionalInfo("Updated info");
        updatedCompany.setEmail("updated@company.com");
        updatedCompany.setPhone("+37255500000");

        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));
        when(participantRepository.existsByRegistrationCode("87654321")).thenReturn(false);
        when(participantRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Participant result = participantService.updateParticipant(2L, updatedCompany);

        // Assert
        assertEquals("Updated Company", ((Company) result).getCompanyName());
        assertEquals("87654321", ((Company) result).getRegistrationCode());
        assertEquals(10, ((Company) result).getParticipantCount());
        assertEquals("Updated Contact", ((Company) result).getContactPerson());
        assertEquals(Participant.PaymentMethod.BANK_TRANSFER, result.getPaymentMethod());
        assertEquals("Updated info", result.getAdditionalInfo());
        verify(participantRepository, times(1)).findById(2L);
        verify(participantRepository, times(1)).existsByRegistrationCode("87654321");
        verify(participantRepository, times(1)).save(any(Company.class));
    }

    @Test
    void updateParticipant_WithChangedDuplicateRegistrationCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        Company updatedCompany = new Company();
        updatedCompany.setRegistrationCode("87654321"); // Different registration code

        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));
        when(participantRepository.existsByRegistrationCode("87654321")).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> participantService.updateParticipant(2L, updatedCompany));
        verify(participantRepository, times(1)).findById(2L);
        verify(participantRepository, times(1)).existsByRegistrationCode("87654321");
        verify(participantRepository, never()).save(any());
    }

    @Test
    void updateParticipant_WhenParticipantTypeMismatchForCompany_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.updateParticipant(1L, company));
        verify(participantRepository, times(1)).findById(1L);
        verify(participantRepository, never()).save(any());
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

    @Test
    void validateRegistrationCode_WithValidCode_ShouldNotThrowException() {
        // Valid registration codes
        assertDoesNotThrow(() -> participantService.validateRegistrationCode("12345678"));
        assertDoesNotThrow(() -> participantService.validateRegistrationCode("87654321"));
    }

    @Test
    void validateRegistrationCode_WithInvalidFormat_ShouldThrowIllegalArgumentException() {
        // Invalid formats
        assertThrows(IllegalArgumentException.class, () -> {
            participantService.validateRegistrationCode("123");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            participantService.validateRegistrationCode("1234567");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            participantService.validateRegistrationCode("123456789");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            participantService.validateRegistrationCode("1234567a");
        });
    }
}