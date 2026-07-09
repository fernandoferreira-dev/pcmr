package com.pcmr.api.repository;

import com.pcmr.api.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    List<Mensagem> findByDestinatario_IdUtilizadorOrderByDataEnvioDesc(Long idUtilizadorDestinatario);

    List<Mensagem> findByDestinatario_IdUtilizadorAndRemetente_Pessoa_NomeContainingIgnoreCaseOrderByDataEnvioDesc(
            Long idUtilizadorDestinatario, String nomeRemetente
    );
}