package com.attendify.backend.repository;

import com.attendify.backend.domain.Person;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonRepository extends JpaRepository<Person, Long> {
    boolean existsByPersonalCode(String personalCode);
}
