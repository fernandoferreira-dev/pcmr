package com.pcmr.api.repository;

import com.pcmr.api.model.TipoUtilizador;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoUtilizadorRepository extends CrudRepository<TipoUtilizador, Long> {
}