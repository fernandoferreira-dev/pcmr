package com.pcmr.api.repository;

import com.pcmr.api.model.AcessoBiometrico;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcessoBiometricoRepository extends CrudRepository<AcessoBiometrico, Long> {
    // Procura o registo biométrico com base na string/ID da impressão digital
    Optional<AcessoBiometrico> findByImpAcesso(String impAcesso);
}