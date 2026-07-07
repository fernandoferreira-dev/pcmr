package com.pcmr.api.controller;

import com.pcmr.api.dto.PerfilUtilizadorDTO;
import com.pcmr.api.model.Pessoa;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/utilizadores")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/perfil")
    public ResponseEntity<?> perfil(@PathVariable Long id) {
        Optional<Utilizador> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "erro", "Utilizador não encontrado"
            ));
        }

        Utilizador user = userOpt.get();
        Pessoa pessoa = user.getPessoa();

        PerfilUtilizadorDTO dto = new PerfilUtilizadorDTO();
        dto.setUsername(user.getUsername());
        dto.setNome(pessoa.getNome());
        dto.setEmail(pessoa.getEmail());
        dto.setTelemovel(pessoa.getTelemovel());
        dto.setDataNascimento(
                pessoa.getDataNascimento() != null ? pessoa.getDataNascimento().toString() : null
        );
        dto.setTipoUtilizador(user.getTipoUtilizador().getNome());

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/perfil")
    public ResponseEntity<?> atualizarPerfil(@PathVariable Long id, @RequestBody PerfilUtilizadorDTO dto) {
        Optional<Utilizador> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "erro", "Utilizador não encontrado"
            ));
        }

        Utilizador user = userOpt.get();
        Pessoa pessoa = user.getPessoa();

        if (dto.getUsername() == null || dto.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "O nome de utilizador não pode estar vazio."));
        }
        if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "O email não pode estar vazio."));
        }

        Optional<Utilizador> existenteUsername = userRepository.findByUsername(dto.getUsername());
        if (existenteUsername.isPresent() && !existenteUsername.get().getIdUtilizador().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Este nome de utilizador já está em uso."));
        }

        Optional<Utilizador> existenteEmail = userRepository.findByPessoaEmail(dto.getEmail());
        if (existenteEmail.isPresent() && !existenteEmail.get().getIdUtilizador().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Este email já está associado a outra conta."));
        }

        user.setUsername(dto.getUsername());
        user.setDataUltimaAtualizacao(OffsetDateTime.now()); // Regista o momento da modificação

        pessoa.setNome(dto.getNome());
        pessoa.setEmail(dto.getEmail());
        pessoa.setTelemovel(dto.getTelemovel());

        if (dto.getDataNascimento() != null && !dto.getDataNascimento().trim().isEmpty()) {
            try {
                pessoa.setDataNascimento(LocalDate.parse(dto.getDataNascimento()));
                
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Formato de data inválido. Use YYYY-MM-DD."));
            }
        } else {
            pessoa.setDataNascimento(null);
        }

        Utilizador utilizadorGuardado = userRepository.save(user);

        PerfilUtilizadorDTO dtoResposta = new PerfilUtilizadorDTO();
        dtoResposta.setUsername(utilizadorGuardado.getUsername());
        dtoResposta.setNome(pessoa.getNome());
        dtoResposta.setEmail(pessoa.getEmail());
        dtoResposta.setTelemovel(pessoa.getTelemovel());
        dtoResposta.setDataNascimento(
                pessoa.getDataNascimento() != null ? pessoa.getDataNascimento().toString() : null
        );
        dtoResposta.setTipoUtilizador(utilizadorGuardado.getTipoUtilizador().getNome());

        return ResponseEntity.ok(dtoResposta);
    }
}