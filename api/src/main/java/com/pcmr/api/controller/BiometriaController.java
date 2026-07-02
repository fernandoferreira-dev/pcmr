package com.pcmr.api.controller;

import com.pcmr.api.model.LoginModel;
import com.pcmr.api.repository.UserRepository;
import com.pcmr.api.service.BiometriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/biometria")
public class BiometriaController {

    @Autowired
    private BiometriaService biometriaService;

    @Autowired
    private UserRepository userRepository;

    /**
     * POST /api/biometria/registar
     * Inicia o processo de registo de impressão digital para um utilizador.
     * Body: { "userId": 123 }
     */
    @PostMapping("/registar")
    public ResponseEntity<?> iniciarRegisto(@RequestBody Map<String, Integer> body) {
        Integer userId = body.get("userId");
        if (userId == null || userId <= 0) {
            return ResponseEntity.badRequest().body("{\"erro\": \"userId é obrigatório\"}");
        }

        // Verifica se o utilizador existe
        Optional<LoginModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("{\"erro\": \"Utilizador não encontrado\"}");
        }

        try {
            CompletableFuture<Boolean> future = biometriaService.iniciarRegisto(userId);
            Boolean resultado = future.get(35, TimeUnit.SECONDS);

            if (Boolean.TRUE.equals(resultado)) {
                // Associar o ID da impressão ao utilizador na BD
                LoginModel user = userOpt.get();
                user.setImpressaoDigital(String.valueOf(userId)); // userId = fingerprintId neste caso
                userRepository.save(user);

                return ResponseEntity.ok(Map.of(
                        "sucesso", true,
                        "mensagem", "Impressão digital registada com sucesso!"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                        "sucesso", false,
                        "mensagem", "Falha ao registar impressão digital. Tente novamente."
                ));
            }
        } catch (java.util.concurrent.TimeoutException e) {
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(Map.of(
                    "sucesso", false,
                    "mensagem", "Tempo excedido. Coloque o dedo no sensor quando solicitado."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "sucesso", false,
                    "mensagem", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/biometria/login/iniciar
     * Inicia o processo de login por impressão digital.
     * Retorna um correlationId que o frontend deve usar para fazer polling.
     */
    @PostMapping("/login/iniciar")
    public ResponseEntity<?> iniciarLogin() {
        String correlationId = biometriaService.iniciarLogin();
        return ResponseEntity.ok(Map.of(
                "correlationId", correlationId,
                "mensagem", "Coloque o dedo no sensor"
        ));
    }

    /**
     * GET /api/biometria/login/status?correlationId=xxx
     * Verifica se o login por impressão digital já foi concluído.
     * Retorna os dados do utilizador se encontrado, ou { "status": "pendente" } se ainda não.
     */
    @GetMapping("/login/status")
    public ResponseEntity<?> checkLoginStatus(@RequestParam String correlationId) {
        if (correlationId == null || correlationId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "correlationId é obrigatório"));
        }

        Optional<LoginModel> userOpt = biometriaService.checkLoginStatus(correlationId);

        if (userOpt.isPresent()) {
            LoginModel user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                    "status", "autenticado",
                    "userId", user.getId(),
                    "nome", user.getNome(),
                    "email", user.getEmail() != null ? user.getEmail() : "",
                    "tipoUtilizador", user.getTipoDeUtilizador() != null ? user.getTipoDeUtilizador() : ""
            ));
        }

        return ResponseEntity.ok(Map.of("status", "pendente"));
    }

    /**
     * POST /api/biometria/associar
     * Associa uma impressão digital (fingerprintId) a um utilizador.
     * Body: { "userId": 123, "fingerprintId": 456 }
     * Isto pode ser chamado manualmente se o ESP32 já tiver registado mas a BD não foi atualizada.
     */
    @PostMapping("/associar")
    public ResponseEntity<?> associarImpressao(@RequestBody Map<String, Integer> body) {
        Integer userId = body.get("userId");
        Integer fingerprintId = body.get("fingerprintId");

        if (userId == null || fingerprintId == null) {
            return ResponseEntity.badRequest().body(Map.of("erro", "userId e fingerprintId são obrigatórios"));
        }

        Optional<LoginModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Utilizador não encontrado"));
        }

        LoginModel user = userOpt.get();
        user.setImpressaoDigital(String.valueOf(fingerprintId));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "sucesso", true,
                "mensagem", "Impressão digital associada ao utilizador com sucesso!"
        ));
    }
}
