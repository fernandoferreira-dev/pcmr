package com.pcmr.api.repository;

import com.pcmr.api.model.Utilizador;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends CrudRepository<Utilizador, Long> {
    Optional<Utilizador> findByPessoaEmail(String email);
    Optional<Utilizador> findByUsername(String username);
}