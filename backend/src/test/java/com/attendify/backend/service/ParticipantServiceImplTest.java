package com.attendify.backend.service;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Participant;
import com.attendify.backend.domain.Person;
import com.attendify.backend.exception.DuplicateResourceException;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.ParticipantRepository;
import jakarta.validation.constraints.NotNull;
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
import java.util.Collections;
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
    private Pageable pageable;

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
        company.setContactPerson("Jane Smith");
        company.setPaymentMethod(Participant.PaymentMethod.CARD);
        company.setAdditionalInfo("Gold sponsor");
        company.setEmail("info@testcompany.com");
        company.setPhone("+37255598765");

        pageable = PageRequest.of(0, 10);
    }

    @Test
    void getAllParticipants_ShouldReturnPageOfParticipants() {
        // Arrange
        Page<Participant> expectedPage = new PageImpl<>(Arrays.asList(person, company));
        when(participantRepository.findAll(pageable)).thenReturn(expectedPage);

        // Act
        Page<Participant> resultPage = participantService.getAllParticipants(pageable);

        // Assert
        assertEquals(expectedPage, resultPage);
        verify(participantRepository, times(1)).findAll(pageable);
    }

    @Test
    void searchParticipants_WithEmptyQuery_ShouldReturnAllParticipants() {
        // Arrange
        Page<Participant> expectedPage = new PageImpl<>(Arrays.asList(person, company));
        when(participantRepository.findAll(pageable)).thenReturn(expectedPage);

        // Act
        Page<Participant> resultPage = participantService.searchParticipants("", null, null, pageable);

        // Assert
        assertEquals(expectedPage, resultPage);
        verify(participantRepository, times(1)).findAll(pageable);
    }

    @Test
    void searchParticipants_WithPersonType_ShouldSearchPersonsByField() {
        // Arrange
        String query = "John";
        String type = "person";
        String field = "name";
        Page<Participant> expectedPage = new PageImpl<>(Collections.singletonList(person));
        when(participantRepository.searchPersonsByField(query, field, pageable)).thenReturn(expectedPage);

        // Act
        Page<Participant> resultPage = participantService.searchParticipants(query, type, field, pageable);

        // Assert
        assertEquals(expectedPage, resultPage);
        verify(participantRepository, times(1)).searchPersonsByField(query, field, pageable);
    }

    @Test
    void searchParticipants_WithCompanyType_ShouldSearchCompaniesByField() {
        // Arrange
        String query = "Test";
        String type = "company";
        String field = "name";
        Page<Participant> expectedPage = new PageImpl<>(Collections.singletonList(company));
        when(participantRepository.searchCompaniesByField(query, field, pageable)).thenReturn(expectedPage);

        // Act
        Page<Participant> resultPage = participantService.searchParticipants(query, type, field, pageable);

        // Assert
        assertEquals(expectedPage, resultPage);
        verify(participantRepository, times(1)).searchCompaniesByField(query, field, pageable);
    }

    @Test
    void searchParticipants_WithDefaultType_ShouldSearchParticipantsByField() {
        // Arrange
        String query = "Test";
        String type = "";
        String field = "name";
        Page<Participant> expectedPage = new PageImpl<>(Arrays.asList(person, company));
        when(participantRepository.searchParticipantsByField(query, field, pageable)).thenReturn(expectedPage);

        // Act
        Page<Participant> resultPage = participantService.searchParticipants(query, type, field, pageable);

        // Assert
        assertEquals(expectedPage, resultPage);
        verify(participantRepository, times(1)).searchParticipantsByField(query, field, pageable);
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
        assertEquals("john.doe@example.com", ((Person) result).getEmail());
        assertEquals("+37255512345", ((Person) result).getPhone());
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
        assertEquals("info@testcompany.com", ((Company) result).getEmail());
        assertEquals("+37255598765", ((Company) result).getPhone());
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
        company.setRegistrationCode("12345"); // Invalid registration code

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
        when(participantRepository.save(any(Company.class))).thenReturn(company);

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
        when(participantRepository.save(any(Company.class))).thenReturn(company);

        // Act
        Participant result = participantService.createParticipant(company);

        // Assert
        assertEquals(1, ((Company) result).getParticipantCount());
        verify(participantRepository, times(1)).existsByRegistrationCode(company.getRegistrationCode());
        verify(participantRepository, times(1)).save(any(Company.class));
    }

    @Test
    void createParticipant_WithNullParticipant_ShouldThrowIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> participantService.createParticipant(null));
        assertEquals("Participant cannot be null", exception.getMessage());
        verify(participantRepository, never()).save(any());
    }

    @Test
    void createParticipant_WithUnknownParticipantType_ShouldThrowIllegalArgumentException() {
        // Arrange
        Participant unknownParticipant = mock(Participant.class);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.createParticipant(unknownParticipant));
        verify(participantRepository, never()).save(any());
    }

    @Test
    void updateParticipant_WithValidPerson_ShouldUpdateAndReturnPerson() {
        // Arrange
        Person updatedPerson = new Person();
        updatedPerson.setFirstName("Updated");
        updatedPerson.setLastName("Name");
        updatedPerson.setPersonalCode("39506070819");
        updatedPerson.setPaymentMethod(Participant.PaymentMethod.CASH);
        updatedPerson.setAdditionalInfo("Updated info");
        updatedPerson.setEmail("updated.doe@example.com");
        updatedPerson.setPhone("+37255567890");

        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));
        when(participantRepository.existsByPersonalCode("39506070819")).thenReturn(false);
        when(participantRepository.save(any(Person.class))).thenReturn(updatedPerson);

        // Act
        Participant result = participantService.updateParticipant(1L, updatedPerson);

        // Assert
        assertEquals("Updated", ((Person) result).getFirstName());
        assertEquals("Name", ((Person) result).getLastName());
        assertEquals("39506070819", ((Person) result).getPersonalCode());
        assertEquals(Participant.PaymentMethod.CASH, result.getPaymentMethod());
        assertEquals("Updated info", result.getAdditionalInfo());
        assertEquals("updated.doe@example.com", ((Person) result).getEmail());
        assertEquals("+37255567890", ((Person) result).getPhone());
        verify(participantRepository, times(1)).findById(1L);
        verify(participantRepository, times(1)).existsByPersonalCode("39506070819");
        verify(participantRepository, times(1)).save(any(Person.class));
    }

    @Test
    void updateParticipant_WithSamePersonalCode_ShouldUpdateAndReturnPerson() {
        // Arrange
        Person updatedPerson = new Person();
        updatedPerson.setFirstName("Updated");
        updatedPerson.setLastName("Name");
        updatedPerson.setPersonalCode("38001150120"); // Same personal code
        updatedPerson.setPaymentMethod(Participant.PaymentMethod.CASH);
        updatedPerson.setAdditionalInfo("Updated info");

        when(participantRepository.findById(1L)).thenReturn(Optional.of(person));
        when(participantRepository.save(any(Person.class))).thenReturn(updatedPerson);

        // Act
        Participant result = participantService.updateParticipant(1L, updatedPerson);

        // Assert
        assertEquals("Updated", ((Person) result).getFirstName());
        assertEquals("Name", ((Person) result).getLastName());
        assertEquals("38001150120", ((Person) result).getPersonalCode());
        verify(participantRepository, times(1)).findById(1L);
        verify(participantRepository, never()).existsByPersonalCode(any());
        verify(participantRepository, times(1)).save(any(Person.class));
    }

    @Test
    void updateParticipant_WithChangedDuplicatePersonalCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        Person updatedPerson = new Person();
        updatedPerson.setPersonalCode("49506070819");

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
        Company updatedCompany = getUpdatedCompany();

        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));
        when(participantRepository.existsByRegistrationCode("87654321")).thenReturn(false);
        when(participantRepository.save(any(Company.class))).thenReturn(updatedCompany);

        // Act
        Participant result = participantService.updateParticipant(2L, updatedCompany);

        // Assert
        assertEquals("Updated Company", ((Company) result).getCompanyName());
        assertEquals("87654321", ((Company) result).getRegistrationCode());
        assertEquals(10, ((Company) result).getParticipantCount());
        assertEquals("Updated Contact", ((Company) result).getContactPerson());
        assertEquals(Participant.PaymentMethod.BANK_TRANSFER, result.getPaymentMethod());
        assertEquals("Updated info", result.getAdditionalInfo());
        assertEquals("updated@company.com", ((Company) result).getEmail());
        assertEquals("+37255500000", ((Company) result).getPhone());
        verify(participantRepository, times(1)).findById(2L);
        verify(participantRepository, times(1)).existsByRegistrationCode("87654321");
        verify(participantRepository, times(1)).save(any(Company.class));
    }

    private static @NotNull Company getUpdatedCompany() {
        Company updatedCompany = new Company();
        updatedCompany.setCompanyName("Updated Company");
        updatedCompany.setRegistrationCode("87654321");
        updatedCompany.setParticipantCount(10);
        updatedCompany.setContactPerson("Updated Contact");
        updatedCompany.setPaymentMethod(Participant.PaymentMethod.BANK_TRANSFER);
        updatedCompany.setAdditionalInfo("Updated info");
        updatedCompany.setEmail("updated@company.com");
        updatedCompany.setPhone("+37255500000");
        return updatedCompany;
    }

    @Test
    void updateParticipant_WithSameRegistrationCode_ShouldUpdateAndReturnCompany() {
        // Arrange
        Company updatedCompany = new Company();
        updatedCompany.setCompanyName("Updated Company");
        updatedCompany.setRegistrationCode("12345678"); // Same registration code
        updatedCompany.setParticipantCount(10);
        updatedCompany.setContactPerson("Updated Contact");
        updatedCompany.setPaymentMethod(Participant.PaymentMethod.BANK_TRANSFER);
        updatedCompany.setAdditionalInfo("Updated info");

        when(participantRepository.findById(2L)).thenReturn(Optional.of(company));
        when(participantRepository.save(any(Company.class))).thenReturn(updatedCompany);

        // Act
        Participant result = participantService.updateParticipant(2L, updatedCompany);

        // Assert
        assertEquals("Updated Company", ((Company) result).getCompanyName());
        assertEquals("12345678", ((Company) result).getRegistrationCode());
        assertEquals(10, ((Company) result).getParticipantCount());
        verify(participantRepository, times(1)).findById(2L);
        verify(participantRepository, never()).existsByRegistrationCode(any());
        verify(participantRepository, times(1)).save(any(Company.class));
    }

    @Test
    void updateParticipant_WithChangedDuplicateRegistrationCode_ShouldThrowDuplicateResourceException() {
        // Arrange
        Company updatedCompany = new Company();
        updatedCompany.setRegistrationCode("87654321");

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
    void updateParticipant_WithNullParticipantDetails_ShouldThrowIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> participantService.updateParticipant(1L, null));
        assertEquals("Participant details cannot be null", exception.getMessage());
        verify(participantRepository, never()).findById(anyLong());
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
        IllegalArgumentException exception1 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateEstonianPersonalCode("123"));
        assertEquals("Invalid Estonian personal code format", exception1.getMessage());

        IllegalArgumentException exception2 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateEstonianPersonalCode("3950607081"));
        assertEquals("Invalid Estonian personal code format", exception2.getMessage());

        IllegalArgumentException exception3 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateEstonianPersonalCode("79506070819"));
        assertEquals("Invalid Estonian personal code format", exception3.getMessage());

        IllegalArgumentException exception4 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateEstonianPersonalCode("3950607081a"));
        assertEquals("Invalid Estonian personal code format", exception4.getMessage());

        IllegalArgumentException exception5 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateEstonianPersonalCode(""));
        assertEquals("Invalid Estonian personal code format", exception5.getMessage());

        IllegalArgumentException exception6 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateEstonianPersonalCode(null));
        assertEquals("Personal code cannot be null", exception6.getMessage());
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
        IllegalArgumentException exception1 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateRegistrationCode("123"));
        assertEquals("Invalid registration code format: must be 8 digits", exception1.getMessage());

        IllegalArgumentException exception2 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateRegistrationCode("1234567"));
        assertEquals("Invalid registration code format: must be 8 digits", exception2.getMessage());

        IllegalArgumentException exception3 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateRegistrationCode("123456789"));
        assertEquals("Invalid registration code format: must be 8 digits", exception3.getMessage());

        IllegalArgumentException exception4 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateRegistrationCode("1234567a"));
        assertEquals("Invalid registration code format: must be 8 digits", exception4.getMessage());

        IllegalArgumentException exception5 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateRegistrationCode(""));
        assertEquals("Invalid registration code format: must be 8 digits", exception5.getMessage());

        IllegalArgumentException exception6 = assertThrows(IllegalArgumentException.class,
                () -> participantService.validateRegistrationCode(null));
        assertEquals("Registration code cannot be null", exception6.getMessage());
    }
}