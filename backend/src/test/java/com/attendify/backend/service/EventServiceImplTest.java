package com.attendify.backend.service;

import com.attendify.backend.domain.Event;
import com.attendify.backend.exception.ResourceNotFoundException;
import com.attendify.backend.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventServiceImpl eventService;

    private Event event1;
    private Event event2;
    private Instant now;

    @BeforeEach
    void setUp() {
        now = Instant.now();

        // Setup test events
        event1 = new Event();
        event1.setId(1L);
        event1.setName("Test Event 1");
        event1.setDateTime(now.plusSeconds(86400)); // tomorrow
        event1.setLocation("Test Location 1");
        event1.setStatus("SCHEDULED");
        event1.setAdditionalInfo("Test Info 1");

        event2 = new Event();
        event2.setId(2L);
        event2.setName("Test Event 2");
        event2.setDateTime(now.minusSeconds(86400)); // yesterday
        event2.setLocation("Test Location 2");
        event2.setStatus("COMPLETED");
        event2.setAdditionalInfo("Test Info 2");
    }

    @Test
    void getFutureEvents_ShouldReturnFutureEvents() {
        // Arrange
        when(eventRepository.findByDateTimeAfterOrderByDateTime(any(Instant.class)))
                .thenReturn(Collections.singletonList(event1));

        // Act
        List<Event> result = eventService.getFutureEvents();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Test Event 1", result.getFirst().getName());
        verify(eventRepository, times(1)).findByDateTimeAfterOrderByDateTime(any(Instant.class));
    }

    @Test
    void getPastEvents_ShouldReturnPastEvents() {
        // Arrange
        when(eventRepository.findByDateTimeBeforeOrderByDateTimeDesc(any(Instant.class)))
                .thenReturn(Collections.singletonList(event2));

        // Act
        List<Event> result = eventService.getPastEvents();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Test Event 2", result.getFirst().getName());
        verify(eventRepository, times(1)).findByDateTimeBeforeOrderByDateTimeDesc(any(Instant.class));
    }

    @Test
    void getEventById_WithValidId_ShouldReturnEvent() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));

        // Act
        Event result = eventService.getEventById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Event 1", result.getName());
        verify(eventRepository, times(1)).findById(1L);
    }

    @Test
    void getEventById_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(eventRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> eventService.getEventById(999L));
        verify(eventRepository, times(1)).findById(999L);
    }

    @Test
    void createEvent_WithValidEvent_ShouldSaveAndReturnEvent() {
        // Arrange
        when(eventRepository.save(any(Event.class))).thenReturn(event1);

        // Act
        Event result = eventService.createEvent(event1);

        // Assert
        assertNotNull(result);
        assertEquals("Test Event 1", result.getName());
        verify(eventRepository, times(1)).save(event1);
    }

    @Test
    void createEvent_WithInvalidEvent_ShouldThrowException() {
        // Arrange
        Event invalidEvent = new Event();
        invalidEvent.setDateTime(now);
        invalidEvent.setStatus("SCHEDULED");
        // Missing name

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> eventService.createEvent(invalidEvent));
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void updateEvent_WithValidEvent_ShouldUpdateAndReturnEvent() {
        // Arrange
        Event updatedEvent = new Event();
        updatedEvent.setId(1L);
        updatedEvent.setName("Updated Event");
        updatedEvent.setDateTime(now.plusSeconds(3600) );
        updatedEvent.setLocation("Updated Location");
        updatedEvent.setStatus("POSTPONED");
        updatedEvent.setAdditionalInfo("Updated Info");

        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Event result = eventService.updateEvent(updatedEvent);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Event", result.getName());
        assertEquals("Updated Location", result.getLocation());
        assertEquals("POSTPONED", result.getStatus());
        assertEquals("Updated Info", result.getAdditionalInfo());
        verify(eventRepository, times(1)).findById(1L);
        verify(eventRepository, times(1)).save(any(Event.class));
    }

    @Test
    void updateEvent_WithInvalidEvent_ShouldThrowException() {
        // Arrange
        Event invalidEvent = new Event();
        invalidEvent.setId(1L);
        invalidEvent.setDateTime(now);
        invalidEvent.setLocation("Updated Location");
        // Missing name and status

        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> eventService.updateEvent(invalidEvent));
        verify(eventRepository, times(1)).findById(1L);
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void deleteEvent_WithValidId_ShouldDeleteEvent() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));
        doNothing().when(eventRepository).delete(any(Event.class));

        // Act
        eventService.deleteEvent(1L);

        // Assert
        verify(eventRepository, times(1)).findById(1L);
        verify(eventRepository, times(1)).delete(event1);
    }

    @Test
    void deleteEvent_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(eventRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> eventService.deleteEvent(999L));
        verify(eventRepository, times(1)).findById(999L);
        verify(eventRepository, never()).delete(any(Event.class));
    }

    @Test
    void validateEvent_WithMissingName_ShouldThrowException() {
        // Arrange
        Event invalidEvent = new Event();
        invalidEvent.setDateTime(now);
        invalidEvent.setStatus("SCHEDULED");
        // Missing name

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> eventService.createEvent(invalidEvent));
    }

    @Test
    void validateEvent_WithMissingDateTime_ShouldThrowException() {
        // Arrange
        Event invalidEvent = new Event();
        invalidEvent.setName("Test Event");
        invalidEvent.setStatus("SCHEDULED");
        // Missing dateTime

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> eventService.createEvent(invalidEvent));
    }
}