package com.pcmr.api.repository;

import com.pcmr.api.model.UtilizadorPacienteAcesso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UtilizadorPacienteAcessoRepository extends JpaRepository<UtilizadorPacienteAcesso, Long> {
}