package com.pcmr.api.service;

import com.pcmr.api.model.AcessoBiometrico;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.mqtt.MqttPublisherService;
import com.pcmr.api.repository.AcessoBiometricoRepository;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

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

    private final Map<Long, CompletableFuture<Boolean>> pendingEnrollments = new ConcurrentHashMap<>();
    private final Map<String, CompletableFuture<Integer>> pendingLogins = new ConcurrentHashMap<>();

    public CompletableFuture<Boolean> iniciarRegisto(long userId) {
        CompletableFuture<Boolean> existente = pendingEnrollments.get(userId);
        if (existente != null && !existente.isDone()) {
            CompletableFuture<Boolean> falha = new CompletableFuture<>();
            falha.completeExceptionally(
                new IllegalStateException("Já existe um registo pendente para este utilizador"));
            return falha;
        }

        CompletableFuture<Boolean> future = new CompletableFuture<>();
        pendingEnrollments.put(userId, future);

        mqttPublisher.publish(topicComando, "{\"modo\": \"enroll\"}");

        CompletableFuture.delayedExecutor(30, TimeUnit.SECONDS).execute(() -> {
            pendingEnrollments.computeIfPresent(userId, (id, f) -> {
                if (f == future && !f.isDone()) {
                    f.completeExceptionally(new java.util.concurrent.TimeoutException(
                        "Registo excedeu 30s"));
                    mqttPublisher.publish(topicComando, "{\"modo\": \"idle\"}");
                    return null;
                }
                return f;
            });
        });

        return future;
    }

    public void completarRegisto(int fingerprintId, boolean sucesso) {
        Long userId = null;
        CompletableFuture<Boolean> futureCompletada = null;

        for (Map.Entry<Long, CompletableFuture<Boolean>> entry : pendingEnrollments.entrySet()) {
            if (!entry.getValue().isDone()) {
                userId = entry.getKey();
                futureCompletada = entry.getValue();
                break;
            }
        }

        if (userId == null) {
            System.out.println("Resposta de enroll recebida sem registo pendente correspondente.");
            return;
        }

        if (sucesso) {
            try {
                Utilizador user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Utilizador não encontrado"));

                AcessoBiometrico acesso = acessoBiometricoRepository
                        .findByUtilizador_IdUtilizador(userId)
                        .orElseGet(AcessoBiometrico::new);

                acesso.setUtilizador(user);
                acesso.setImpAcesso(String.valueOf(fingerprintId));
                acesso.setDataRegisto(OffsetDateTime.now());

                acessoBiometricoRepository.save(acesso);

                System.out.println("Utilizador " + userId + " associado ao ID biométrico " + fingerprintId);

                pendingEnrollments.remove(userId);
                futureCompletada.complete(true);
            } catch (Exception e) {
                System.err.println("Erro ao gravar registo biométrico: " + e.getMessage());
                pendingEnrollments.remove(userId);
                futureCompletada.complete(false);
            } finally {
                mqttPublisher.publish(topicComando, "{\"modo\": \"idle\"}");
            }
        } else {
            pendingEnrollments.remove(userId);
            futureCompletada.complete(false);
            mqttPublisher.publish(topicComando, "{\"modo\": \"idle\"}");
        }
    }

    public String iniciarLogin() {
        String correlationId = UUID.randomUUID().toString();
        CompletableFuture<Integer> future = new CompletableFuture<>();
        pendingLogins.put(correlationId, future);

        mqttPublisher.publish(topicComando, "{\"modo\": \"login\"}");

        CompletableFuture.delayedExecutor(30, TimeUnit.SECONDS).execute(() -> {
            CompletableFuture<Integer> f = pendingLogins.remove(correlationId);
            if (f != null && !f.isDone()) {
                f.completeExceptionally(new RuntimeException("Timeout: Leitura de impressão digital excedeu 30s"));
                mqttPublisher.publish(topicComando, "{\"modo\": \"idle\"}");
            }
        });

        return correlationId;
    }

    public Optional<Utilizador> checkLoginStatus(String correlationId) {
        CompletableFuture<Integer> future = pendingLogins.get(correlationId);
        if (future == null || !future.isDone()) return Optional.empty();

        try {
            int fingerprintId = future.get();
            pendingLogins.remove(correlationId);

            Optional<AcessoBiometrico> bioAcesso =
                    acessoBiometricoRepository.findByImpAcesso(String.valueOf(fingerprintId));

            mqttPublisher.publish(topicComando, "{\"modo\": \"idle\"}");

            if (bioAcesso.isPresent()) {
                Utilizador user = bioAcesso.get().getUtilizador();
                System.out.println("Login biométrico efetuado por: " + user.getUsername());
                return Optional.of(user);
            } else {
                System.out.println("ID " + fingerprintId + " sem utilizador associado.");
                return Optional.empty();
            }
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void completarDeteccao(int fingerprintId) {
        for (Map.Entry<String, CompletableFuture<Integer>> entry : pendingLogins.entrySet()) {
            if (!entry.getValue().isDone()) {
                entry.getValue().complete(fingerprintId);
                System.out.println("✓ Login processado para ID: " + fingerprintId);
                return;
            }
        }
    }
}