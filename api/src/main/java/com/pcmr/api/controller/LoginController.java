package com.pcmr.api.controller;

import com.pcmr.api.model.LoginModel;
import com.pcmr.api.repository.UserRepository;
import com.pcmr.api.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoginService loginService;

    // Standard Request DTO for login
    public static class LoginRequest {
        // Accept either nome (username) or email
        public String username;
        public String password;
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        if (request.username == null || request.password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("username and password required");
        }

        Optional<LoginModel> userOpt = loginService.authenticate(request.username, request.password);

        if (userOpt.isPresent()) {
            return ResponseEntity.ok("Login successful");
        } else {
            // Could be wrong password or not found; keep response generic or differentiate
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
    }
}
