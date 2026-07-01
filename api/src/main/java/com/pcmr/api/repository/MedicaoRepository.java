package com.pcmr.api.repository;

import com.pcmr.api.model.Medicao;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicaoRepository extends CrudRepository<Medicao, Long> {
    Optional<Medicao> findFirstByPacienteIdOrderByIniciadoEmDesc(Long pacienteId);
}