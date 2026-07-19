package com.pcmr.api.repository;

import com.pcmr.api.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    List<Mensagem> findByDestinatario_IdUtilizadorOrderByDataEnvioDesc(Long idUtilizadorDestinatario);

    List<Mensagem> findByDestinatario_IdUtilizadorAndRemetente_Pessoa_NomeContainingIgnoreCaseOrderByDataEnvioDesc(
            Long idUtilizadorDestinatario, String nomeRemetente
    );

    List<Mensagem> findByRemetente_IdUtilizadorOrderByDataEnvioDesc(Long idUtilizadorRemetente);

    List<Mensagem> findByRemetente_IdUtilizadorAndDestinatario_Pessoa_NomeContainingIgnoreCaseOrderByDataEnvioDesc(
            Long idUtilizadorRemetente, String nomeDestinatario
    );

    long deleteByGuardadaFalse();
}