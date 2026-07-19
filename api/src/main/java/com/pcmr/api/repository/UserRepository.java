package com.pcmr.api.repository;
import com.pcmr.api.model.Utilizador;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends CrudRepository<Utilizador, Long> {
    Optional<Utilizador> findByPessoaEmail(String email);
    Optional<Utilizador> findByUsername(String username);
    List<Utilizador> findByPessoa_NomeContainingIgnoreCase(String nome);
    Optional<Utilizador> findByPessoa_Email(String email);
}