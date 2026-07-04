package com.pcmr.api.repository;

import com.pcmr.api.model.AcessoBiometrico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AcessoBiometricoRepository extends JpaRepository<AcessoBiometrico, Long> {
    Optional<AcessoBiometrico> findByImpAcesso(String impAcesso);
    Optional<AcessoBiometrico> findByUtilizador_IdUtilizador(Long idUtilizador);
}