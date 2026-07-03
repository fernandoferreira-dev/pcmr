package com.pcmr.api.service;

import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LoginService {

    @Autowired
    private UserRepository userRepository;

    // Instancia o encoder do BCrypt
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Nome alterado para "authenticate" e retorno para Optional<Utilizador> para casar com o Controller
    public Optional<Utilizador> authenticate(String username, String passwordInseridaPeloUtilizador) {
        // 1. Procura o utilizador na Base de Dados
        Optional<Utilizador> userOpt = userRepository.findByUsername(username); 
        
        if (userOpt.isPresent()) {
            Utilizador user = userOpt.get();
            
            String passwordEncriptadaNaBD = user.getPassword(); // O "$2y$10$..."
            
            // O BCrypt valida de forma segura o "1234" contra o hash
            if (passwordEncoder.matches(passwordInseridaPeloUtilizador, passwordEncriptadaNaBD)) {
                return userOpt; // Password correta, devolve o utilizador
            }
        }
        
        return Optional.empty(); // Falhou a autenticação, devolve vazio
    }
}