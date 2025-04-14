package com.attendify.backend.mapper;

import com.attendify.backend.domain.EventParticipant;
import com.attendify.backend.dto.EventParticipantDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EventParticipantMapper {

    private final ParticipantMapper participantMapper;

    public EventParticipantDTO toDto(EventParticipant eventParticipant) {
        EventParticipantDTO dto = new EventParticipantDTO();
        dto.setParticipant(participantMapper.toDto(eventParticipant.getParticipant()));
        dto.setAttendanceStatus(eventParticipant.getAttendanceStatus());
        dto.setRegisteredAt(eventParticipant.getRegisteredAt());
        return dto;
    }
}