package com.pcmr.api.repository;

import com.pcmr.api.model.Diagnostico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DiagnosticoRepository extends JpaRepository<Diagnostico, Long> {

    @Query(value = """
        SELECT TO_CHAR(gdh_diagnostico, 'YYYY-MM') AS mes, COUNT(*) AS quantidade
        FROM diagnostico
        GROUP BY mes
        ORDER BY mes
        """, nativeQuery = true)
    List<Object[]> countPorMes();
}