package com.pcmr.api.repository;

import com.pcmr.api.model.ConfiguracaoSistema;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfiguracaoSistemaRepository extends JpaRepository<ConfiguracaoSistema, Long> {
    Optional<ConfiguracaoSistema> findTopByOrderByAtualizadoEmDesc();
}