package com.attendify.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Event name cannot be empty")
    @Size(max = 100, message = "Event name must not exceed 100 characters")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Date and time must be specified")
    @Column(name = "date_time", nullable = false)
    private OffsetDateTime dateTime;

    @NotBlank(message = "Location cannot be empty")
    @Size(max = 200, message = "Location must not exceed 200 characters")
    @Column(nullable = false)
    private String location;

    @Size(max = 1000, message = "Additional info must not exceed 1000 characters")
    @Column(name = "additional_info", length = 1000)
    private String additionalInfo;

    @ManyToMany
    @JoinTable(
            name = "event_participant",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private List<Participant> participants = new ArrayList<>();
}