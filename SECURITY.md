## 🔐 Security Measures

This section outlines security best practices implemented and recommended for the **Attendify** application.

### 1. Store Database Credentials in Environment Files

Sensitive credentials such as database usernames and passwords should **not be hardcoded**. Instead, they should be stored in an `.env` file:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/attendify
```

* Ensure `.env` is excluded from version control via `.gitignore`.
* This approach simplifies environment-specific configuration and reduces the risk of accidental credential leaks.

---

### 2. Encrypt Sensitive Properties

**Encrypt credentials and secrets** used by the backend, such as database passwords or API keys.

#### Option A: Jasypt (for Spring Boot)

* Encrypt sensitive values using Jasypt:

  ```yaml
  spring:
    datasource:
      password: ENC(encrypted-password-here)

  jasypt:
    encryptor:
      password: ${ENCRYPTION_PASSWORD}
  ```
* Use a secure master encryption password via environment variable.

#### Option B: Use External Secret Managers (recommended for production)

* Examples: **AWS Secrets Manager**, **HashiCorp Vault**, **Azure Key Vault**.

---

### 3. Implement Role-Based Access Control (RBAC) and JWT Authentication

To restrict access to sensitive endpoints and data:

#### Role-Based Access Control

* Define roles such as:

    * `ADMIN`
    * `ORGANIZER`
    * `PARTICIPANT`
* Protect controller methods using annotations:

  ```java
  @PreAuthorize("hasRole('ADMIN')")
  ```

#### JWT (JSON Web Token) Authentication

* Authenticate users and generate secure JWTs after login.
* Tokens include identity and role claims, and are attached to API requests:

  ```
  Authorization: Bearer <jwt-token>
  ```

##### Benefits:

* Stateless and scalable authentication.
* Fine-grained access control per role.
* Easy integration with Angular frontend.

---

### ✅ Summary

| Measure                      | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| Environment File (.env)      | Store secrets outside codebase                               |
| Property Encryption (Jasypt) | Encrypt database passwords and other sensitive values        |
| Secret Managers (Production) | Use cloud-native secure vaults                               |
| RBAC + JWT                   | Enforce secure and scalable authentication and authorization |

These measures collectively enhance the **security posture** of the Attendify system in both development and production environments.
