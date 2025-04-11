package com.attendify.backend.repository;

import com.attendify.backend.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;

// Репозиторий для компаний
public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByRegistrationCode(String registrationCode);
}
