package com.pcmr.api.controller;

import com.pcmr.api.model.Pessoa;
import com.pcmr.api.model.TipoUtilizador;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Instancia o encoder aqui também
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestParam String name,
                                               @RequestParam String email,
                                               @RequestParam String password) {
        if (name == null || name.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("name, email and password are required");
        }

        if (userRepository.findByUsername(name).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("username already exists");
        }

        try {
            Utilizador n = new Utilizador();
            n.setUsername(name);
            n.setPassword(passwordEncoder.encode(password));

            Pessoa pessoa = new Pessoa();
            pessoa.setNome(name);
            pessoa.setEmail(email);
            n.setPessoa(pessoa);

            TipoUtilizador tipoUtilizador = new TipoUtilizador();
            tipoUtilizador.setNome("utilizador");
            tipoUtilizador.setDescricao("Conta criada via registo");
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