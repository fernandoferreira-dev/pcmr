package com.pcmr.api.repository;

import com.pcmr.api.model.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
    Optional<Sensor> findByNome(String nome);
    List<Sensor> findByNomeContainingIgnoreCase(String nome);
}