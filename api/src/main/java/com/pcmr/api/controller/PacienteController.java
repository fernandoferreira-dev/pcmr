package com.pcmr.api.controller;

import com.pcmr.api.model.Pessoa;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.model.UtilizadorPacienteAcesso;
import com.pcmr.api.repository.PessoaRepository;
import com.pcmr.api.repository.UtilizadorPacienteAcessoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private UtilizadorPacienteAcessoRepository acessoRepository;

    @GetMapping("/procurar")
    public ResponseEntity<List<Pessoa>> procurar(@RequestParam(required = false) String nome) {
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.ok(pessoaRepository.findAll());
        }
        return ResponseEntity.ok(pessoaRepository.findByNomeContainingIgnoreCase(nome));
    }

    public static class ValidarAcessoRequest {
        public String codigo;
    }

    @PostMapping("/acesso/validar")
    public ResponseEntity<?> validarAcesso(@RequestBody ValidarAcessoRequest req) {
        if (req.codigo == null || req.codigo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Código é obrigatório"));
        }

        Optional<UtilizadorPacienteAcesso> acessoOpt =
                acessoRepository.findByTokenAcesso(req.codigo.trim());

        if (acessoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", "Código inválido"));
        }

        UtilizadorPacienteAcesso acesso = acessoOpt.get();

        if (acesso.getDataFim() != null && acesso.getDataFim().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", "Código expirado"));
        }

        Utilizador utilizador = acesso.getUtilizador();
        if (utilizador == null || utilizador.getPessoa() == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", "Dados de utilizador inconsistentes"));
        }

        return ResponseEntity.ok(Map.of(
                "userId", utilizador.getIdUtilizador(),
                "idPessoa", utilizador.getPessoa().getIdPessoa(),
                "nome", utilizador.getPessoa().getNome()
        ));
    }
}