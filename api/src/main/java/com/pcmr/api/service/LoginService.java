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

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public Optional<Utilizador> authenticate(String username, String passwordInseridaPeloUtilizador) {
        System.out.println("\n>>> 1. INICIAR AUTENTICAÇÃO PARA: '" + username + "'");
        Optional<Utilizador> userOpt = userRepository.findByUsername(username); 
        
        if (userOpt.isPresent()) {
            Utilizador user = userOpt.get();
            String passwordEncriptadaNaBD = user.getPassword(); 
            
            System.out.println(">>> 2. PASSWORD RAW RECEBIDA DO FRONTEND: '" + passwordInseridaPeloUtilizador + "'");
            System.out.println(">>> 3. HASH LIDO DA BD: '" + passwordEncriptadaNaBD + "'");
            
            if (passwordEncriptadaNaBD != null && passwordEncriptadaNaBD.startsWith("$2y$")) {
                passwordEncriptadaNaBD = passwordEncriptadaNaBD.replaceFirst("\\$2y\\$", "\\$2a\\$");
                System.out.println(">>> 4. HASH CORRIGIDO PARA $2a$: '" + passwordEncriptadaNaBD + "'");
            }
            if (passwordEncoder.matches(passwordInseridaPeloUtilizador, passwordEncriptadaNaBD)) {
                System.out.println(">>> 5. SUCESSO: As passwords coincidem!\n");
                return userOpt; 
            } else {
                System.out.println(">>> 5. FALHA: O Spring diz que as passwords NÃO coincidem.\n");
            }
        } else {
            System.out.println(">>> FALHA: Utilizador '" + username + "' não encontrado na BD.\n");
        }
        
        return Optional.empty(); 
    }
}