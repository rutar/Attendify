package com.attendify.backend.service;

import com.attendify.backend.domain.Company;
import com.attendify.backend.domain.Event;
import com.attendify.backend.domain.EventParticipant;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.EventParticipantRepository;
import com.attendify.backend.repository.EventRepository;
import com.attendify.backend.repository.ParticipantRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private ParticipantRepository participantRepository;

    @Mock
    private EventParticipantRepository eventParticipantRepository;

    @InjectMocks
    private EventServiceImpl eventService;

    private Company createTestCompany() {
        Company company = new Company();
        company.setId(1L);
        company.setCompanyName("Test Company");
        company.setRegistrationCode("12345678");
        return company;
    }

    private Event createTestEvent(boolean future) {
        Event event = new Event();
        event.setId(1L);
        event.setDateTime(future ? Instant.now().plusSeconds(3600) : Instant.now().minusSeconds(3600));
        return event;
    }


// General functionality test
@Nested
class EventCrudTests {
    @Test
    void getFutureEvents_ShouldReturnFutureEvents() {
        // Arrange
        Event event = createTestEvent(true);
        when(eventRepository.findByDateTimeAfterOrderByDateTime(any())).thenReturn(List.of(event));

        // Act
        List<Event> result = eventService.getFutureEvents();

        // Assert
        assertEquals(1, result.size());
        assertTrue(result.getFirst().isFutureEvent());
        verify(eventRepository).findByDateTimeAfterOrderByDateTime(any());
    }

    @Test
    void getPastEvents_ShouldReturnPastEvents() {
        // Arrange
        Event event = createTestEvent(false);
        when(eventRepository.findByDateTimeBeforeOrderByDateTimeDesc(any())).thenReturn(List.of(event));

        // Act
        List<Event> result = eventService.getPastEvents();

        // Assert
        assertEquals(1, result.size());
        assertFalse(result.getFirst().isFutureEvent());
        verify(eventRepository).findByDateTimeBeforeOrderByDateTimeDesc(any());
    }

    @Test
    void getEventById_WhenExists_ShouldReturnEvent() {
        // Arrange
        Long eventId = 1L;
        Event event = createTestEvent(true);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        // Act
        Event result = eventService.getEventById(eventId);

        // Assert
        assertNotNull(result);
        assertEquals(eventId, result.getId());
        verify(eventRepository).findById(eventId);
    }

    @Test
    void getEventById_WhenNotExists_ShouldThrowException() {
        // Arrange
        Long eventId = 1L;
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> eventService.getEventById(eventId));
        verify(eventRepository).findById(eventId);
    }

    @Test
    void createEvent_WithFutureDate_ShouldSaveEvent() {
        // Arrange
        Event event = createTestEvent(true);
        when(eventRepository.save(any())).thenReturn(event);

        // Act
        Event result = eventService.createEvent(event);

        // Assert
        assertNotNull(result);
        verify(eventRepository).save(event);
    }

    @Test
    void createEvent_WithPastDate_ShouldThrowException() {
        // Arrange
        Event event = createTestEvent(false);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> eventService.createEvent(event));
        verify(eventRepository, never()).save(any());
    }

    @Test
    void updateEvent_WhenExists_ShouldUpdateEvent() {
        // Arrange
        Long eventId = 1L;
        Event existingEvent = createTestEvent(true);
        existingEvent.setCreatedAt(Instant.now());
        existingEvent.setEventParticipants(Collections.emptyList());

        Event updatedEvent = createTestEvent(true);
        updatedEvent.setId(eventId);
        updatedEvent.setName("Updated Name");

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(existingEvent));
        when(eventRepository.save(any())).thenReturn(updatedEvent);

        // Act
        Event result = eventService.updateEvent(updatedEvent);

        // Assert
        assertEquals("Updated Name", result.getName());
        verify(eventRepository).save(updatedEvent);
    }

    @Test
    void deleteEvent_WhenFutureEvent_ShouldDelete() {
        // Arrange
        Long eventId = 1L;
        Event event = createTestEvent(true);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        // Act
        eventService.deleteEvent(eventId);

        // Assert
        verify(eventRepository).delete(event);
    }

    @Test
    void addParticipantToEvent_ShouldCreateRelationship() {
        // Arrange
        Long eventId = 1L;
        Long companyId = 1L;
        Event event = createTestEvent(true);
        Company company = createTestCompany();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(participantRepository.findById(companyId)).thenReturn(Optional.of(company));

        // Act
        EventParticipant result = eventService.addParticipantToEvent(eventId, companyId, null);

        // Assert
        assertNotNull(result);
        verify(eventRepository).save(event);
    }

    @Test
    void updateParticipantStatus_ShouldUpdateStatus() {
        // Arrange
        Long eventId = 1L;
        Long companyId = 1L;
        Event event = createTestEvent(true);
        Company company = createTestCompany();
        EventParticipant eventParticipant = new EventParticipant(event, company);
        event.getEventParticipants().add(eventParticipant);

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(participantRepository.findById(companyId)).thenReturn(Optional.of(company));

        // Act
        EventParticipant result = eventService.updateParticipantStatus(
                eventId, companyId, EventParticipant.AttendanceStatus.NO_SHOW
        );

        // Assert
        assertEquals(EventParticipant.AttendanceStatus.NO_SHOW, result.getAttendanceStatus());
    }

    @Test
    void removeParticipantFromEvent_ShouldDeleteRelationship() {
        // Arrange
        Long eventId = 1L;
        Long companyId = 1L;
        Event event = createTestEvent(true);
        Company company = createTestCompany();
        EventParticipant eventParticipant = new EventParticipant(event, company);
        event.getEventParticipants().add(eventParticipant);
        company.getEventParticipants().add(eventParticipant);

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(participantRepository.findById(companyId)).thenReturn(Optional.of(company));

        // Act
        eventService.removeParticipantFromEvent(eventId, companyId);

        // Assert
        verify(eventRepository).save(event);
    }
}

    @Nested
    class CascadeOpsTests {
        @Test
        @Transactional
        void createEvent_WithParticipants_ShouldCascadeSave() {
            // Arrange
            Event event = createTestEvent(true);
            event.setId(1L); // Устанавливаем ID для event
            Company company = createTestCompany();
            company.setId(1L); // Устанавливаем ID для participant

            EventParticipant participant = new EventParticipant(event, company);
            event.setEventParticipants(List.of(participant));

            when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
                Event savedEvent = invocation.getArgument(0);
                savedEvent.getEventParticipants().forEach(ep -> {
                    // Устанавливаем составной ID
                    ep.setId(new EventParticipant.EventParticipantId(
                            savedEvent.getId(),
                            ep.getParticipant().getId()
                    ));
                });
                return savedEvent;
            });

            // Act
            Event result = eventService.createEvent(event);

            // Assert
            assertNotNull(result.getId());
            assertEquals(1, result.getEventParticipants().size());
            assertNotNull(result.getEventParticipants().getFirst().getId());
            assertEquals(new EventParticipant.EventParticipantId(1L, 1L),
                    result.getEventParticipants().getFirst().getId());
            verify(eventRepository).save(event);
        }


        @Test
        @Transactional
        void removeParticipantFromEvent_ShouldCleanUpBothSides() {
            // Arrange - Set up test data
            Long eventId = 1L;
            Long companyId = 1L;

            // Create test event and set ID
            Event event = createTestEvent(true);
            event.setId(eventId);

            // Create test company (participant) and set ID
            Company company = createTestCompany();
            company.setId(companyId);

            // Create the association between event and participant
            EventParticipant participant = new EventParticipant(event, company);
            participant.setId(new EventParticipant.EventParticipantId(eventId, companyId));

            // Add to both sides of the bidirectional relationship
            event.getEventParticipants().add(participant);
            company.getEventParticipants().add(participant);

            // Mock repository responses
            when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
            when(participantRepository.findById(companyId)).thenReturn(Optional.of(company));
            when(eventRepository.save(event)).thenReturn(event);

            // Act - Call the method being tested
            eventService.removeParticipantFromEvent(eventId, companyId);

            // Assert - Verify the results

            // 1. Check the participant was removed from both collections
            assertFalse(event.getEventParticipants().contains(participant));
            assertFalse(company.getEventParticipants().contains(participant));

            // 2. Verify the event was saved with updated participants list
            // This triggers the orphanRemoval behavior
            verify(eventRepository).save(event);
        }

        @Test
        void eventParticipantId_EqualsAndHashCode_ShouldWorkCorrectly() {
            // Arrange
            EventParticipant.EventParticipantId id1 = new EventParticipant.EventParticipantId(1L, 1L);
            EventParticipant.EventParticipantId id2 = new EventParticipant.EventParticipantId(1L, 1L);
            EventParticipant.EventParticipantId id3 = new EventParticipant.EventParticipantId(2L, 1L);

            // Assert
            assertEquals(id1, id2);
            assertNotEquals(id1, id3);
            assertEquals(id1.hashCode(), id2.hashCode());
            assertNotEquals(id1.hashCode(), id3.hashCode());
        }

        @Test
        void findEventParticipant_ByCompositeId_ShouldReturnEntity() {
            // Arrange
            Long eventId = 1L;
            Long companyId = 1L;
            EventParticipant.EventParticipantId id = new EventParticipant.EventParticipantId(eventId, companyId);
            EventParticipant participant = new EventParticipant();
            participant.setId(id);

            when(eventParticipantRepository.findById(id)).thenReturn(Optional.of(participant));

            // Act
            Optional<EventParticipant> result = eventParticipantRepository.findById(id);

            // Assert
            assertTrue(result.isPresent());
            assertEquals(id, result.get().getId());
        }
    }
}