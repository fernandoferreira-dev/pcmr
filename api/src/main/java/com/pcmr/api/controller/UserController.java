package com.pcmr.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pcmr.api.model.Pessoa;
import com.pcmr.api.model.TipoUtilizador;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.TipoUtilizadorRepository;
import com.pcmr.api.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TipoUtilizadorRepository tipoUtilizadorRepository;

    // Instancia o encoder aqui também
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public static class UserProfileResponse {
        public String username;
        public String phoneNumber;
        public String email;
        public String birthDate;
        public String selectedOption;

        public UserProfileResponse(String username, String email) {
            this.username = username;
            this.phoneNumber = "";
            this.email = email;
            this.birthDate = "";
            this.selectedOption = "opcao-pt";
        }
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
