package com.pcmr.api.repository;

import com.pcmr.api.model.AlertaClinico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertaClinicoRepository extends JpaRepository<AlertaClinico, Integer> {

    List<AlertaClinico> findBySensor_NomeAndDataHoraAfterOrderByDataHoraDesc(String nomeSensor, LocalDateTime desde);

    List<AlertaClinico> findBySensor_IdSensorAndDataHoraBetweenOrderByDataHoraAsc(
            Long idSensor, LocalDateTime inicio, LocalDateTime fim);
}