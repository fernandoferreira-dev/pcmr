package com.pcmr.api.service;

import com.pcmr.api.model.LoginModel;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LoginService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Authenticate by nome (username) or email. Returns the user if credentials match.
     */
    public Optional<LoginModel> authenticate(String usernameOrEmail, String password) {
        if (usernameOrEmail == null) return Optional.empty();

        // try by nome first
        Optional<LoginModel> byNome = userRepository.findByNome(usernameOrEmail);
        if (byNome.isPresent()) {
            LoginModel user = byNome.get();
            if (user.getPasswordHash() != null && user.getPasswordHash().equals(password)) {
                return Optional.of(user);
            }
            return Optional.empty();
        }

        // fallback to email
        Optional<LoginModel> byEmail = userRepository.findByEmail(usernameOrEmail);
        if (byEmail.isPresent()) {
            LoginModel user = byEmail.get();
            if (user.getPasswordHash() != null && user.getPasswordHash().equals(password)) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
}
