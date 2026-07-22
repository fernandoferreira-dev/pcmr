package com.pcmr.api.repository;

import com.pcmr.api.model.UtilizadorPacienteAcesso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UtilizadorPacienteAcessoRepository extends JpaRepository<UtilizadorPacienteAcesso, Long> {
    Optional<UtilizadorPacienteAcesso> findByTokenAcesso(String tokenAcesso);
}