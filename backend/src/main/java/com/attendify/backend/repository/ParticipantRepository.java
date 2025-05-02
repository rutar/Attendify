package com.attendify.backend.repository;

import com.attendify.backend.domain.Participant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    @Query("SELECT COUNT(p) > 0 FROM Person p WHERE p.personalCode = :personalCode")
    boolean existsByPersonalCode(@Param("personalCode") String personalCode);

    @Query("SELECT COUNT(c) > 0 FROM Company c WHERE c.registrationCode = :registrationCode")
    boolean existsByRegistrationCode(@Param("registrationCode") String registrationCode);

    @Query("SELECT p FROM Participant p "
            + "LEFT JOIN Person per ON p.id = per.id "
            + "LEFT JOIN Company com ON p.id = com.id "
            + "WHERE (:query IS NULL OR :query = '') OR "
            + "(:field = '' OR :field = 'all' OR "
            + "(:field = 'firstname' AND LOWER(per.firstName) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'lastname' AND LOWER(per.lastName) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'personalcode' AND LOWER(per.personalCode) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'email' AND LOWER(per.email) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'phone' AND LOWER(per.phone) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'companyname' AND LOWER(com.companyName) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'registrationcode' AND LOWER(com.registrationCode) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'contactperson' AND LOWER(com.contactPerson) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'additionalinfo' AND LOWER(p.additionalInfo) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<Participant> searchParticipantsByField(@Param("query") String query, @Param("field") String field, Pageable pageable);

    @Query("SELECT p FROM Participant p WHERE TYPE(p) = Person "
            + "AND (:query IS NULL OR :query = '' OR "
            + "(:field = '' OR :field = 'all' OR "
            + "(:field = 'firstname' AND LOWER(TREAT(p AS Person).firstName) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'lastname' AND LOWER(TREAT(p AS Person).lastName) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'personalcode' AND LOWER(TREAT(p AS Person).personalCode) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'email' AND LOWER(TREAT(p AS Person).email) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'phone' AND LOWER(TREAT(p AS Person).phone) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'additionalinfo' AND LOWER(p.additionalInfo) LIKE LOWER(CONCAT('%', :query, '%')))))")
    Page<Participant> searchPersonsByField(@Param("query") String query, @Param("field") String field, Pageable pageable);

    @Query("SELECT p FROM Participant p WHERE TYPE(p) = Company "
            + "AND (:query IS NULL OR :query = '' OR "
            + "(:field = '' OR :field = 'all' OR "
            + "(:field = 'companyname' AND LOWER(TREAT(p AS Company).companyName) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'registrationcode' AND LOWER(TREAT(p AS Company).registrationCode) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'contactperson' AND LOWER(TREAT(p AS Company).contactPerson) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'email' AND LOWER(TREAT(p AS Company).email) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'phone' AND LOWER(TREAT(p AS Company).phone) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
            + "(:field = 'additionalinfo' AND LOWER(p.additionalInfo) LIKE LOWER(CONCAT('%', :query, '%')))))")
    Page<Participant> searchCompaniesByField(@Param("query") String query, @Param("field") String field, Pageable pageable);
}