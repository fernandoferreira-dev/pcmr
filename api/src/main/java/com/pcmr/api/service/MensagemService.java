package com.pcmr.api.service;

import com.pcmr.api.dto.MensagemDTO;
import com.pcmr.api.dto.NovaMensagemRequestDTO;
import com.pcmr.api.model.Mensagem;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.MensagemRepository;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MensagemService {

    @Autowired
    private MensagemRepository mensagemRepository;

    @Autowired
    private UserRepository userRepository;

    public List<MensagemDTO> listarRecebidas(Long idUtilizador, String pesquisa) {
        List<Mensagem> mensagens = (pesquisa == null || pesquisa.isBlank())
                ? mensagemRepository.findByDestinatario_IdUtilizadorOrderByDataEnvioDesc(idUtilizador)
                : mensagemRepository.findByDestinatario_IdUtilizadorAndRemetente_Pessoa_NomeContainingIgnoreCaseOrderByDataEnvioDesc(idUtilizador, pesquisa);

        return mensagens.stream().map(this::paraDTO).collect(Collectors.toList());
    }

    public List<MensagemDTO> listarEnviadas(Long idUtilizador, String pesquisa) {
        List<Mensagem> mensagens = (pesquisa == null || pesquisa.isBlank())
                ? mensagemRepository.findByRemetente_IdUtilizadorOrderByDataEnvioDesc(idUtilizador)
                : mensagemRepository.findByRemetente_IdUtilizadorAndDestinatario_Pessoa_NomeContainingIgnoreCaseOrderByDataEnvioDesc(idUtilizador, pesquisa);

        return mensagens.stream().map(this::paraDTO).collect(Collectors.toList());
    }

    public MensagemDTO enviar(NovaMensagemRequestDTO req) {
        if (req.getIdRemetente() == null || req.getIdDestinatario() == null) {
            throw new IllegalArgumentException("Remetente e destinatário são obrigatórios");
        }
        if (req.getIdRemetente().equals(req.getIdDestinatario())) {
            throw new IllegalArgumentException("Não pode enviar uma mensagem a si próprio");
        }
        if (req.getAssunto() == null || req.getAssunto().isBlank()) {
            throw new IllegalArgumentException("O assunto é obrigatório");
        }

        Utilizador remetente = userRepository.findById(req.getIdRemetente())
                .orElseThrow(() -> new IllegalArgumentException("Remetente não encontrado"));
        Utilizador destinatario = userRepository.findById(req.getIdDestinatario())
                .orElseThrow(() -> new IllegalArgumentException("Destinatário não encontrado"));

        Mensagem mensagem = new Mensagem();
        mensagem.setRemetente(remetente);
        mensagem.setDestinatario(destinatario);
        mensagem.setAssunto(req.getAssunto());
        mensagem.setCorpo(req.getCorpo());

        return paraDTO(mensagemRepository.save(mensagem));
    }

    public void marcarComoLida(Long idMensagem, Long idUtilizadorAtual) {
        Mensagem mensagem = mensagemRepository.findById(idMensagem)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada"));

        if (!mensagem.getDestinatario().getIdUtilizador().equals(idUtilizadorAtual)) {
            throw new IllegalStateException("Não tem permissão para alterar esta mensagem");
        }

        mensagem.setLida(true);
        mensagemRepository.save(mensagem);
    }

    public void apagar(Long idMensagem, Long idUtilizadorAtual) {
        Mensagem mensagem = mensagemRepository.findById(idMensagem)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada"));

        if (!mensagem.getDestinatario().getIdUtilizador().equals(idUtilizadorAtual)) {
            throw new IllegalStateException("Não tem permissão para apagar esta mensagem");
        }

        mensagemRepository.delete(mensagem);
    }

    private MensagemDTO paraDTO(Mensagem m) {
        MensagemDTO dto = new MensagemDTO();
        dto.setIdMensagem(m.getIdMensagem());

        dto.setIdRemetente(m.getRemetente().getIdUtilizador());
        dto.setNomeRemetente(m.getRemetente().getPessoa().getNome());
        dto.setEmailRemetente(m.getRemetente().getPessoa().getEmail());

        dto.setIdDestinatario(m.getDestinatario().getIdUtilizador());
        dto.setNomeDestinatario(m.getDestinatario().getPessoa().getNome());
        dto.setEmailDestinatario(m.getDestinatario().getPessoa().getEmail());

        dto.setAssunto(m.getAssunto());
        dto.setCorpo(m.getCorpo());
        dto.setDataEnvio(m.getDataEnvio().toString());
        dto.setLida(m.isLida());
        return dto;
    }
}