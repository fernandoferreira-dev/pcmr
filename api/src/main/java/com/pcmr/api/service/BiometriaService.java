package com.pcmr.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.model.AcessoBiometrico;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.mqtt.MqttPublisherService;
import com.pcmr.api.repository.AcessoBiometricoRepository;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.zip.CRC32;

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

    // Chave AES-128 sincronizada com o ESP32
    private static final byte[] AES_KEY = {
        (byte)0x84, (byte)0x24, (byte)0x0b, (byte)0x86, (byte)0xd0, (byte)0x93, (byte)0x09, (byte)0xb8,
        (byte)0x68, (byte)0x18, (byte)0x48, (byte)0x96, (byte)0x21, (byte)0x22, (byte)0xe2, (byte)0xfa
    };

    /**
     * Desempacota o envelope MQTT cifrado, valida o CRC32 rigorosamente sobre os bytes
     * e devolve a string JSON plano se tudo estiver correto.
     */
    public String desempacotarEDecifrar(String envelopeJsonMQTT) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode envelope = mapper.readTree(envelopeJsonMQTT);
            
            if (!envelope.has("iv") || !envelope.has("data") || !envelope.has("crc")) {
                System.err.println("❌ Envelope MQTT inválido: faltam campos obrigatórios.");
                return null;
            }

            String ivB64 = envelope.get("iv").asText();
            String dataB64 = envelope.get("data").asText();
            long crcEsperado = envelope.get("crc").asLong();

            byte[] iv = Base64.getDecoder().decode(ivB64);
            byte[] cifrado = Base64.getDecoder().decode(dataB64);

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            SecretKeySpec keySpec = new SecretKeySpec(AES_KEY, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);

            byte[] plaintext = cipher.doFinal(cifrado);

            // Validação CRC diretamente nos bytes limpos
            CRC32 crc32 = new CRC32();
            crc32.update(plaintext);
            long crcCalculado = crc32.getValue();

            if (crcEsperado != crcCalculado) {
                System.err.println("❌ CRC inválido! Esperado: " + crcEsperado + " | Calculado: " + crcCalculado);
                System.err.println("Tamanho plaintext: " + plaintext.length);
                return null;
            }

            return new String(plaintext, StandardCharsets.UTF_8);

        } catch (Exception e) {
            System.err.println("❌ Falha na decifragem/validade CRC: " + e.getMessage());
            return null;
        }
    }

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

    public void cancelarRegisto(long userId) {
        CompletableFuture<Boolean> f = pendingEnrollments.remove(userId);
        if (f != null && !f.isDone()) {
            f.completeExceptionally(new java.util.concurrent.CancellationException("Cancelado pelo utilizador"));
        }
        mqttPublisher.publish(topicComando, "{\"modo\": \"idle\"}");
    }

    public void cancelarLogin(String correlationId) {
        CompletableFuture<Integer> f = pendingLogins.remove(correlationId);
        if (f != null && !f.isDone()) {
            f.completeExceptionally(new java.util.concurrent.CancellationException("Cancelado pelo utilizador"));
        }
        mqttPublisher.publish(topicComando, "{\"modo\": \"idle\"}");
    }
}