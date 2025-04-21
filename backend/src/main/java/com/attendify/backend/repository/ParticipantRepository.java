package com.attendify.backend.repository;

import com.attendify.backend.domain.Participant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    @Query("SELECT COUNT(p) > 0 FROM Person p WHERE p.personalCode = :personalCode")
    boolean existsByPersonalCode(@Param("personalCode") String personalCode);

    @Query("SELECT COUNT(c) > 0 FROM Company c WHERE c.registrationCode = :registrationCode")
    boolean existsByRegistrationCode(@Param("registrationCode") String registrationCode);

    @Query("SELECT p FROM Participant p "
            + "LEFT JOIN Person per ON p.id = per.id "
            + "LEFT JOIN Company com ON p.id = com.id "
            + "WHERE (:query IS NULL OR :query = '') OR "
            + "LOWER(per.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(per.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(per.personalCode) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(per.email) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(per.phone) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(com.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(com.registrationCode) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(com.contactPerson) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(com.email) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(com.phone) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(p.additionalInfo) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Participant> searchParticipants(@Param("query") String query, Pageable pageable);
}
