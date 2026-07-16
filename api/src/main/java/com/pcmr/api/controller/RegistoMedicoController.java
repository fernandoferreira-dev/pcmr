package com.pcmr.api.controller;

import com.pcmr.api.dto.NovaMensagemRequestDTO;
import com.pcmr.api.dto.SolicitacaoMedicoDTO;
import com.pcmr.api.model.Pessoa;
import com.pcmr.api.model.TipoUtilizador;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.PessoaRepository;
import com.pcmr.api.repository.TipoUtilizadorRepository;
import com.pcmr.api.repository.UserRepository;
import com.pcmr.api.service.MensagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/registo")
public class RegistoMedicoController {

    @Autowired private UserRepository userRepository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private TipoUtilizadorRepository tipoUtilizadorRepository;
    @Autowired private MensagemService mensagemService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/solicitar")
    public ResponseEntity<?> solicitarCriacaoMedico(@RequestBody SolicitacaoMedicoDTO dto) {
        Optional<Utilizador> adminOpt = userRepository.findByPessoa_Email("diogoeliasrocha@gmail.com");
        if (adminOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("erro", "Admin não encontrado."));

        Utilizador sistema = userRepository.findByUsername("sistema")
                .orElseThrow(() -> new RuntimeException("Utilizador 'sistema' não encontrado."));
        String baseUrl = "/api/registo/processar";
        String params = String.format("?nome=%s&email=%s&username=%s&password=%s",
                URLEncoder.encode(dto.getNome(), StandardCharsets.UTF_8),
                URLEncoder.encode(dto.getEmail(), StandardCharsets.UTF_8),
                URLEncoder.encode(dto.getUsername(), StandardCharsets.UTF_8),
                URLEncoder.encode(dto.getPassword(), StandardCharsets.UTF_8));

        NovaMensagemRequestDTO mensagem = new NovaMensagemRequestDTO();
        mensagem.setIdRemetente(sistema.getIdUtilizador());
        mensagem.setIdDestinatario(adminOpt.get().getIdUtilizador());
        mensagem.setAssunto("NOVO PEDIDO: Registo de Médico - " + dto.getNome());
        mensagem.setCorpo("Pedido de registo: " + dto.getNome() + "\n\nLINK_ACAO:" + baseUrl + params + "&acao=aceitar");

        mensagemService.enviar(mensagem);
        return ResponseEntity.ok(Map.of("sucesso", "Pedido enviado."));
    }

    @GetMapping("/processar")
    public ResponseEntity<?> processarRegisto(@RequestParam String acao, @RequestParam(required = false) String nome,
                                              @RequestParam(required = false) String email, @RequestParam(required = false) String username,
                                              @RequestParam(required = false) String password) {

        if ("aceitar".equalsIgnoreCase(acao)) {
            if (userRepository.findByUsername(username).isPresent())
                return ResponseEntity.badRequest().body(Map.of("erro", "Username já existe."));

            TipoUtilizador tipoMedico = null;
            for (TipoUtilizador t : tipoUtilizadorRepository.findAll()) {
                if ("Medico".equalsIgnoreCase(t.getNome())) { tipoMedico = t; break; }
            }
            if (tipoMedico == null) return ResponseEntity.internalServerError().body(Map.of("erro", "Tipo 'Médico' não encontrado."));

            Pessoa p = new Pessoa();
            p.setNome(nome);
            p.setEmail(email);
            p = pessoaRepository.save(p);

            Utilizador u = new Utilizador();
            u.setPessoa(p);
            u.setTipoUtilizador(tipoMedico);
            u.setUsername(username);
            u.setPassword(passwordEncoder.encode(password));
            u = userRepository.save(u);

            Utilizador sistema = userRepository.findByUsername("sistema")
                    .orElseThrow(() -> new RuntimeException("Utilizador 'sistema' não encontrado."));

            NovaMensagemRequestDTO msg = new NovaMensagemRequestDTO();
            msg.setIdRemetente(sistema.getIdUtilizador());
            msg.setIdDestinatario(u.getIdUtilizador());
            msg.setAssunto("Bem-vindo ao PCMR!");
            msg.setCorpo("Olá " + nome + ", a sua conta foi ativada com sucesso.");
            mensagemService.enviar(msg);

            return ResponseEntity.ok(Map.of("sucesso", "Médico criado com sucesso!"));
        }

        return ResponseEntity.badRequest().body(Map.of("erro", "Ação inválida"));
    }
}