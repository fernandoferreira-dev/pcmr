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

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
    return userRepository.findById(id)
            .<ResponseEntity<?>>map(user -> {
                String email = user.getPessoa() != null ? user.getPessoa().getEmail() : "";
                return ResponseEntity.ok(new UserProfileResponse(user.getUsername(), email));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestParam String name,
            @RequestParam String email,
            @RequestParam String password) {
        if (name == null || name.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Nome, email e password são obrigatórios");
        }

        if (userRepository.findByUsername(name).isPresent() || userRepository.findByPessoaEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("nome de utlizador já existe");
        } else if (userRepository.findByPessoaEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Este email já está vinculado a uma conta");
        }
        try {
            Utilizador n = new Utilizador();
            n.setUsername(name);
            n.setPassword(passwordEncoder.encode(password));
            
            Pessoa pessoa = new Pessoa();
            pessoa.setNome(name);
            pessoa.setEmail(email);
            n.setPessoa(pessoa);

            TipoUtilizador tipoUtilizador = tipoUtilizadorRepository.findByNome("utilizador")
                    .orElseGet(() -> {
                        TipoUtilizador novoTipo = new TipoUtilizador();
                        novoTipo.setNome("utilizador");
                        novoTipo.setDescricao("Conta criada via registo");
                        return tipoUtilizadorRepository.save(novoTipo);
                    });
            n.setTipoUtilizador(tipoUtilizador);

            userRepository.save(n);
            return ResponseEntity.status(HttpStatus.CREATED).body("User Saved successfully!");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration failed: " + ex.getMessage());
        }
    }
}
