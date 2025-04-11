package com.attendify.backend.service;

import com.attendify.backend.domain.Participant;
import com.attendify.backend.repository.ParticipantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ParticipantService {
    @Autowired
    private ParticipantRepository participantRepository;

    public List<Participant> getAllParticipants() {
        return participantRepository.findAll();
    }

    public Participant createParticipant(Participant participant) {
        return participantRepository.save(participant);
    }
}