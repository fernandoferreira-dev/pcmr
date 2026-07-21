package com.pcmr.api.repository;

import com.pcmr.api.model.AlertaClinico;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertaClinicoRepository extends JpaRepository<AlertaClinico, Integer> {

    List<AlertaClinico> findBySensor_NomeAndDataHoraAfterOrderByDataHoraDesc(
            String nomeSensor, LocalDateTime desde);

    List<AlertaClinico> findBySensor_IdSensorAndDataHoraBetweenOrderByDataHoraAsc(
            Long idSensor, LocalDateTime inicio, LocalDateTime fim);

    /**
     * NEW: Get the most recent alerts (for /api/alertas/recentes)
     */
    @Query("SELECT a FROM AlertaClinico a ORDER BY a.dataHora DESC")
    List<AlertaClinico> findRecentAlerts(Pageable pageable);

}