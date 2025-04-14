package com.attendify.backend.configuration;

import com.attendify.backend.domain.Event;
import com.attendify.backend.dto.EventDTO;
import org.modelmapper.AbstractConverter;
import org.modelmapper.Conditions;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.LOOSE)
                .setPropertyCondition(Conditions.isNotNull());

        modelMapper.typeMap(Event.class, EventDTO.class)
                .addMappings(mapper -> {
                    mapper.map(Event::getParticipantCount, EventDTO::setParticipantCount);
                });

        return modelMapper;
    }
}