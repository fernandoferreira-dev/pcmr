package com.pcmr.api.repository;
import org.springframework.data.repository.query.Param;
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

    @Query(value = """
    SELECT p.* FROM pessoa p
    WHERE p.id_pessoa NOT IN (
        SELECT u.id_pessoa FROM utilizador u
        JOIN tipo_utilizador tu ON tu.id_tipo_utilizador = u.id_tipo_utilizador
        WHERE tu.nome IN ('Medico', 'Admin')
    )
    AND (:nome IS NULL OR :nome = '' OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%')))
    """, nativeQuery = true)
    List<Pessoa> findPacientesPorNome(@Param("nome") String nome);
}