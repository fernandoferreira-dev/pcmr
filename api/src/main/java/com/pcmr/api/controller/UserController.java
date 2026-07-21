package com.pcmr.api.controller;

import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class UserController {   

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return getUserResponse(id);
    }

    @GetMapping("/utilizadores/{id}")
    public ResponseEntity<?> getUtilizadorById(@PathVariable Long id) {
        return getUserResponse(id);
    }

    @GetMapping("/utilizadores/{id}/perfil")
    public ResponseEntity<?> getPerfil(@PathVariable Long id) {
        return getUserResponse(id);
    }

    @PutMapping("/utilizadores/{id}/perfil")
    public ResponseEntity<?> updatePerfil(@PathVariable Long id, @RequestBody UserProfileRequest request) {
        Optional<Utilizador> userOpt = userRepository.findById(id);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilizador não encontrado");
        }

        Utilizador user = userOpt.get();

        if (user.getPessoa() != null) {
            if (request.nome != null) user.getPessoa().setNome(request.nome);
            if (request.email != null) user.getPessoa().setEmail(request.email);
            if (request.telemovel != null) user.getPessoa().setTelemovel(request.telemovel);
            if (request.dataNascimento != null && !request.dataNascimento.isEmpty()) {
                user.getPessoa().setDataNascimento(LocalDate.parse(request.dataNascimento));
            }
        }

        userRepository.save(user);
        return ResponseEntity.ok(new UserProfileResponse(user));
    }

    // Private helper
    private ResponseEntity<?> getUserResponse(Long id) {
        Optional<Utilizador> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(new UserProfileResponse(userOpt.get()));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Utilizador não encontrado");
        }
    }

    // ==================== DTOs ====================
    public static class UserProfileResponse {
        public Long id;
        public String username;
        public String nome;
        public String email;
        public String telemovel;
        public String dataNascimento;
        public String tipoUtilizador;

        public UserProfileResponse(Utilizador user) {
            this.id = user.getIdUtilizador();
            this.username = user.getUsername();
            this.nome = user.getPessoa() != null ? user.getPessoa().getNome() : "";
            this.email = user.getPessoa() != null ? user.getPessoa().getEmail() : "";
            this.telemovel = user.getPessoa() != null ? user.getPessoa().getTelemovel() : null;
            this.dataNascimento = user.getPessoa() != null && user.getPessoa().getDataNascimento() != null 
                    ? user.getPessoa().getDataNascimento().toString() : null;
            this.tipoUtilizador = user.getTipoUtilizador() != null ? user.getTipoUtilizador().getNome() : "";
        }
    }

    public static class UserProfileRequest {
        public String nome;
        public String email;
        public String telemovel;
        public String dataNascimento;
    }
}