package com.pcmr.api.repository;

import com.pcmr.api.model.ConfiguracaoPresenca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfiguracaoPresencaRepository extends JpaRepository<ConfiguracaoPresenca, Long> {
    Optional<ConfiguracaoPresenca> findTopBySensor_IdSensorOrderByAtualizadoEmDesc(Long idSensor);
}