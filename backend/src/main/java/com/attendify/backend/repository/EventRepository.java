package com.attendify.backend.repository;

import com.attendify.backend.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByDateTimeAfterOrderByDateTime(Instant now);
    List<Event> findByDateTimeBeforeOrderByDateTimeDesc(Instant now);
}