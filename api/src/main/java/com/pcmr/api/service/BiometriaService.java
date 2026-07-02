package com.pcmr.api.service;

import com.pcmr.api.model.LoginModel;
import com.pcmr.api.mqtt.MqttPublisherService;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
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

    /**
     * Mapa de sessões de registo pendentes: userId -> Future que será completado quando o ESP32 confirmar
     */
    private final Map<Integer, CompletableFuture<Boolean>> pendingEnrollments = new ConcurrentHashMap<>();

    /**
     * Mapa de sessões de login pendentes: correlationId -> Future que será completado com o fingerprintId
     */
    private final Map<String, CompletableFuture<Integer>> pendingLogins = new ConcurrentHashMap<>();

    // ========== REGISTO ==========

    /**
     * Inicia o processo de registo de impressão digital para um utilizador.
     * Envia comando REGISTAR:{userId} para o ESP32 via MQTT.
     * Retorna um Future que será completado quando o ESP32 confirmar o registo.
     */
    public CompletableFuture<Boolean> iniciarRegisto(int userId) {
        CompletableFuture<Boolean> future = new CompletableFuture<>();
        pendingEnrollments.put(userId, future);

        // Envia comando para o ESP32
        mqttPublisher.publish(topicComando, "REGISTAR:" + userId);

        // Timeout de 30 segundos
        java.util.concurrent.Executors.newSingleThreadScheduledExecutor()
                .schedule(() -> {
                    CompletableFuture<Boolean> f = pendingEnrollments.remove(userId);
                    if (f != null && !f.isDone()) {
                        f.completeExceptionally(new RuntimeException("Timeout: registo de impressão digital excedeu 30s"));
                    }
                }, 30, java.util.concurrent.TimeUnit.SECONDS);

        return future;
    }

    /**
     * Completar o registo (chamado pelo MqttMessageHandler quando recebe REGISTADO:{id} do ESP32)
     */
    public void completarRegisto(int fingerprintId, boolean sucesso) {
        CompletableFuture<Boolean> future = pendingEnrollments.remove(fingerprintId);
        if (future != null && !future.isDone()) {
            future.complete(sucesso);
        }
    }

    // ========== LOGIN ==========

    /**
     * Gera um correlationId e retorna-o. O frontend faz polling com este ID.
     * Quando o utilizador põe o dedo, o ESP32 publica DETETADO:{fingerprintId}
     * e o handler MQTT completa o future correspondente.
     */
    public String iniciarLogin() {
        String correlationId = java.util.UUID.randomUUID().toString();
        CompletableFuture<Integer> future = new CompletableFuture<>();
        pendingLogins.put(correlationId, future);

        // Timeout de 30 segundos
        java.util.concurrent.Executors.newSingleThreadScheduledExecutor()
                .schedule(() -> {
                    CompletableFuture<Integer> f = pendingLogins.remove(correlationId);
                    if (f != null && !f.isDone()) {
                        f.completeExceptionally(new RuntimeException("Timeout: leitura de impressão digital excedeu 30s"));
                    }
                }, 30, java.util.concurrent.TimeUnit.SECONDS);

        return correlationId;
    }

    /**
     * Verifica se o login com impressão digital já foi concluído.
     * Retorna o utilizador se o fingerprint foi reconhecido e associado na BD.
     */
    public Optional<LoginModel> checkLoginStatus(String correlationId) {
        CompletableFuture<Integer> future = pendingLogins.get(correlationId);
        if (future == null) return Optional.empty();

        if (!future.isDone()) return Optional.empty();

        try {
            int fingerprintId = future.getNow(0);
            if (fingerprintId <= 0) return Optional.empty();

            // Remove da lista de pendentes (já foi processado)
            pendingLogins.remove(correlationId);

            // Procura o utilizador pelo ID da impressão digital
            return userRepository.findByImpressaoDigital(String.valueOf(fingerprintId));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Completa o login com o fingerprintId (chamado pelo MqttMessageHandler quando recebe DETETADO:{id})
     * Verifica se este fingerprint está associado a algum utilizador na BD.
     */
    public void completarDeteccao(int fingerprintId) {
        // Tenta encontrar uma sessão de login pendente
        // Como temos múltiplas sessões possíveis, completamos a primeira que encontrar
        for (Map.Entry<String, CompletableFuture<Integer>> entry : pendingLogins.entrySet()) {
            CompletableFuture<Integer> future = entry.getValue();
            if (!future.isDone()) {
                future.complete(fingerprintId);
                return;
            }
        }
    }

    // ========== CONSULTA ==========

    /**
     * Usado pelo MqttMessageHandler para processar as mensagens MQTT biometria
     */
    public void processarMensagem(String payload) {
        if (payload == null) return;

        // REGISTADO:{id}
        if (payload.startsWith("REGISTADO:")) {
            try {
                int id = Integer.parseInt(payload.substring(10).trim());
                completarRegisto(id, true);
            } catch (NumberFormatException ignored) {}
        }
        // ERRO_REGISTO
        else if (payload.startsWith("ERRO_REGISTO")) {
            // Completa todas as sessões de registo pendentes com erro
            for (Map.Entry<Integer, CompletableFuture<Boolean>> entry : pendingEnrollments.entrySet()) {
                CompletableFuture<Boolean> future = entry.getValue();
                if (!future.isDone()) {
                    future.complete(false);
                }
            }
            pendingEnrollments.clear();
        }
        // DETETADO:{id}
        else if (payload.startsWith("DETETADO:")) {
            try {
                int id = Integer.parseInt(payload.substring(9).trim());
                completarDeteccao(id);
            } catch (NumberFormatException ignored) {}
        }
        // NAO_RECONHECIDO
        else if (payload.startsWith("NAO_RECONHECIDO")) {
            // Notifica todas as sessões de login pendentes que falhou
            for (Map.Entry<String, CompletableFuture<Integer>> entry : pendingLogins.entrySet()) {
                CompletableFuture<Integer> future = entry.getValue();
                if (!future.isDone()) {
                    future.complete(0); // 0 = não reconhecido
                }
            }
        }
    }
}
