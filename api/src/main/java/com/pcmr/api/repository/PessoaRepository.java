package com.pcmr.api.repository;

import com.pcmr.api.model.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
    List<Pessoa> findByNomeContainingIgnoreCase(String nome);

    @Query(value = """
        SELECT COUNT(*) FROM pessoa p
        WHERE p.id_pessoa NOT IN (
            SELECT u.id_pessoa FROM utilizador u
            JOIN tipo_utilizador tu ON tu.id_tipo_utilizador = u.id_tipo_utilizador
            WHERE tu.nome IN ('Medico', 'Admin')
        )
        """, nativeQuery = true)
    long countPacientes();
}