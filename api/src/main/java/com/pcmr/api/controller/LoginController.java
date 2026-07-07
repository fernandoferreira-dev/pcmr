package com.pcmr.api.controller;

import com.pcmr.api.model.Utilizador;
import com.pcmr.api.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class LoginController {

    public static class LoginResponse {
        public String nome;
        public Long userId;
        public String tipo; 

        public LoginResponse(String nome, Long userId, String tipo) {
            this.nome = nome;
            this.userId = userId;
            this.tipo = tipo;
        }
    }

    @Autowired
    private LoginService loginService;

    public static class LoginRequest {
        public String username;
        public String password;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authenticate(request.username, request.password);
    }

    @GetMapping("/login")
    public ResponseEntity<?> loginGet(@RequestParam String username, @RequestParam String password) {
        return authenticate(username, password);
    }

    private ResponseEntity<?> authenticate(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Parametros inválidos");
        }

         // Alterado de LoginModel para Utilizador
        Optional<Utilizador> userOpt = loginService.authenticate(username, password);

        if (userOpt.isPresent()) {
            Utilizador user = userOpt.get();
            
            String tipoUtilizador = user.getTipoUtilizador() != null ? user.getTipoUtilizador().getNome() : "Desconhecido";

            return ResponseEntity.ok(new LoginResponse(user.getUsername(), user.getIdUtilizador(), tipoUtilizador));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Parametros inválidos");
        }
    }
}