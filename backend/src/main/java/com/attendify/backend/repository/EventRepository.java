package com.attendify.backend.repository;

import com.attendify.backend.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByEventDateTimeAfterOrderByEventDateTime(LocalDateTime dateTime);
    List<Event> findByEventDateTimeBeforeOrderByEventDateTimeDesc(LocalDateTime dateTime);
}