package com.pcmr.api.repository;

import com.pcmr.api.model.AlertaClinico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertaClinicoRepository extends JpaRepository<AlertaClinico, Integer> {
}