package com.pcmr.api.service;

import com.pcmr.api.model.AcessoBiometrico;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.mqtt.MqttPublisherService;
import com.pcmr.api.repository.AcessoBiometricoRepository;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BiometriaService {

    @Value("${MQTT_TOPIC_COMANDO:casa/biometria/comando}")
    private String topicComando;

    @Autowired
    private MqttPublisherService mqttPublisher;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AcessoBiometricoRepository acessoBiometricoRepository;

    // Alterado de Integer para Long para aceitar o userId
    private final Map<Long, CompletableFuture<Boolean>> pendingEnrollments = new ConcurrentHashMap<>();
    private final Map<String, CompletableFuture<Integer>> pendingLogins = new ConcurrentHashMap<>();

    // ========== REGISTO ==========

    public CompletableFuture<Boolean> iniciarRegisto(long userId) {
        CompletableFuture<Boolean> future = new CompletableFuture<>();
        pendingEnrollments.put(userId, future); // Agora compila perfeitamente!

        mqttPublisher.publish(topicComando, "REGISTAR:" + userId);

        java.util.concurrent.Executors.newSingleThreadScheduledExecutor()
                .schedule(() -> {
                    CompletableFuture<Boolean> f = pendingEnrollments.remove(userId);
                    if (f != null && !f.isDone()) {
                        f.completeExceptionally(new RuntimeException("Timeout: registo de impressão digital excedeu 30s"));
                    }
                }, 30, java.util.concurrent.TimeUnit.SECONDS);

        return future;
    }

    public void completarRegisto(long fingerprintId, boolean sucesso) {
        CompletableFuture<Boolean> future = pendingEnrollments.remove(fingerprintId);
        if (future != null && !future.isDone()) {
            future.complete(sucesso);
        }
    }

    // ========== LOGIN ==========

    public String iniciarLogin() {
        String correlationId = java.util.UUID.randomUUID().toString();
        CompletableFuture<Integer> future = new CompletableFuture<>();
        pendingLogins.put(correlationId, future);

        java.util.concurrent.Executors.newSingleThreadScheduledExecutor()
                .schedule(() -> {
                    CompletableFuture<Integer> f = pendingLogins.remove(correlationId);
                    if (f != null && !f.isDone()) {
                        f.completeExceptionally(new RuntimeException("Timeout: leitura de impressão digital excedeu 30s"));
                    }
                }, 30, java.util.concurrent.TimeUnit.SECONDS);

        return correlationId;
    }

    public Optional<Utilizador> checkLoginStatus(String correlationId) {
        CompletableFuture<Integer> future = pendingLogins.get(correlationId);
        if (future == null || !future.isDone()) return Optional.empty();

        try {
            int idDigital = future.getNow(0);
            if (idDigital <= 0) return Optional.empty();

            pendingLogins.remove(correlationId);

            Optional<AcessoBiometrico> bioAcesso = acessoBiometricoRepository.findByImpAcesso(String.valueOf(idDigital));
            return bioAcesso.map(AcessoBiometrico::getUtilizador);
            
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void completarDeteccao(int fingerprintId) {
        for (Map.Entry<String, CompletableFuture<Integer>> entry : pendingLogins.entrySet()) {
            CompletableFuture<Integer> future = entry.getValue();
            if (!future.isDone()) {
                future.complete(fingerprintId);
                return;
            }
        }
    }

    // ========== CONSULTA ==========

    public void processarMensagem(String payload) {
        if (payload == null) return;

        if (payload.startsWith("REGISTADO:")) {
            try {
                long id = Long.parseLong(payload.substring(10).trim());
                completarRegisto(id, true);
            } catch (NumberFormatException ignored) {}
        }
        else if (payload.startsWith("ERRO_REGISTO")) {
            for (Map.Entry<Long, CompletableFuture<Boolean>> entry : pendingEnrollments.entrySet()) {
                CompletableFuture<Boolean> future = entry.getValue();
                if (!future.isDone()) {
                    future.complete(false);
                }
            }
            pendingEnrollments.clear();
        }
        else if (payload.startsWith("DETETADO:")) {
            try {
                int id = Integer.parseInt(payload.substring(9).trim());
                completarDeteccao(id);
            } catch (NumberFormatException ignored) {}
        }
        else if (payload.startsWith("NAO_RECONHECIDO")) {
            for (Map.Entry<String, CompletableFuture<Integer>> entry : pendingLogins.entrySet()) {
                CompletableFuture<Integer> future = entry.getValue();
                if (!future.isDone()) {
                    future.complete(0);
                }
            }
        }
    }
}