package com.pcmr.api.repository;

import com.pcmr.api.model.HistoricoSensor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoricoSensorRepository extends JpaRepository<HistoricoSensor, Long> {
    List<HistoricoSensor> findByDiagnosticoIdDiagnosticoOrderByGdhLeituraAsc(Long idDiagnostico);
}