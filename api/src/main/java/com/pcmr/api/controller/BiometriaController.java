package com.pcmr.api.controller;

import com.pcmr.api.model.Utilizador;
import com.pcmr.api.service.BiometriaService;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@RestController
@RequestMapping("/api/biometria")
public class BiometriaController {

    @Autowired
    private BiometriaService biometriaService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/registar")
    public ResponseEntity<?> iniciarRegisto(@RequestBody Map<String, Long> body) {
        Long userId = body.get("userId");
        if (userId == null || userId <= 0) {
            return ResponseEntity.badRequest().body(Map.of("erro", "userId é obrigatório"));
        }

        Optional<Utilizador> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Utilizador não encontrado"));
        }

        Utilizador user = userOpt.get();
        if (!"Medico".equals(user.getTipoUtilizador().getNome())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "sucesso", false,
                    "mensagem", "Apenas utilizadores do tipo Médico podem registar biometria"
            ));
        }

        try {
            CompletableFuture<Boolean> future = biometriaService.iniciarRegisto(userId);
            Boolean resultado = future.get(35, TimeUnit.SECONDS);

            if (Boolean.TRUE.equals(resultado)) {
                return ResponseEntity.ok(Map.of(
                        "sucesso", true,
                        "mensagem", "Impressão digital registada com sucesso!"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                        "sucesso", false,
                        "mensagem", "Falha ao registar impressão digital. Tente novamente."
                ));
            }
        } catch (TimeoutException e) {
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(Map.of(
                    "sucesso", false,
                    "mensagem", "Tempo excedido. Não detetámos o seu dedo a tempo."
            ));
        } catch (ExecutionException e) {
            Throwable causa = e.getCause();
            if (causa instanceof IllegalStateException) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "sucesso", false,
                        "mensagem", causa.getMessage()
                ));
            }
            if (causa instanceof TimeoutException) {
                return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(Map.of(
                        "sucesso", false,
                        "mensagem", "Tempo excedido. Não detetámos o seu dedo a tempo."
                ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "sucesso", false,
                    "mensagem", "Erro interno ao processar o registo biométrico."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "sucesso", false,
                    "mensagem", "Erro desconhecido"
            ));
        }
    }

    @PostMapping("/login/iniciar")
    public ResponseEntity<?> iniciarLogin() {
        String correlationId = biometriaService.iniciarLogin();
        return ResponseEntity.ok(Map.of(
                "correlationId", correlationId,
                "mensagem", "Coloque o dedo no sensor..."
        ));
    }

    @GetMapping("/login/status")
    public ResponseEntity<?> checkLoginStatus(@RequestParam String correlationId) {
        if (correlationId == null || correlationId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "correlationId é obrigatório"));
        }

        Optional<Utilizador> userOpt = biometriaService.checkLoginStatus(correlationId);

        if (userOpt.isPresent()) {
            Utilizador user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                    "status", "autenticado",
                    "userId", user.getIdUtilizador(),
                    "nome", user.getUsername()
            ));
        }

        return ResponseEntity.ok(Map.of("status", "pendente"));
    }
}