package com.pcmr.api.controller;

import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    public String registerUser(@RequestParam String name,
                               @RequestParam String email,
                               @RequestParam String password) {
        Utilizador n = new Utilizador();
        n.setUsername(name);
        
        // ENCRIPTA a password antes de salvar na BD!
        n.setPassword(passwordEncoder.encode(password)); 
        
        userRepository.save(n);
        return "User Saved successfully!";
    }
}