package com.pcmr.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.mqtt.MqttPublisherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AlertaQuedaBuzzerService {

    private static final String TOPIC_ALERTA_QUEDA = "casa/biometria/alerta";
    private static final long DURACAO_MINIMA_MS = 15000; // alarme soa no mínimo 15s

    @Autowired
    private MqttPublisherService mqttPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, Boolean> estadoAtual = new ConcurrentHashMap<>();
    private final Map<String, Long> inicioAlerta = new ConcurrentHashMap<>();

    public void notificarQueda(String deviceId, boolean ativo) {
        if (ativo) {
            // Sempre que chega um "true", (re)inicia a janela mínima
            inicioAlerta.put(deviceId, System.currentTimeMillis());
            publicarSeMudou(deviceId, true);
            return;
        }

        // Pedido para desligar: só aceita se já passou a duração mínima
        Long inicio = inicioAlerta.get(deviceId);
        if (inicio != null && (System.currentTimeMillis() - inicio) < DURACAO_MINIMA_MS) {
            return; // ainda dentro da janela mínima, ignora o "false" prematuro
        }
        publicarSeMudou(deviceId, false);
    }

    @Scheduled(fixedRate = 1000)
    private void expirarAlarmesAntigos() {
        long agora = System.currentTimeMillis();
        inicioAlerta.forEach((deviceId, inicio) -> {
            if (Boolean.TRUE.equals(estadoAtual.get(deviceId)) && (agora - inicio) >= DURACAO_MINIMA_MS) {
                publicarSeMudou(deviceId, false);
            }
        });
    }

    /** Permite silenciar manualmente (ex.: botão "Confirmar" no ecrã do médico) */
    public void silenciarManualmente(String deviceId) {
        inicioAlerta.remove(deviceId);
        publicarSeMudou(deviceId, false);
    }

    private void publicarSeMudou(String deviceId, boolean ativo) {
        Boolean anterior = estadoAtual.put(deviceId, ativo);
        if (anterior != null && anterior == ativo) {
            return;
        }

        try {
            Map<String, Object> payload = Map.of(
                    "tipo", "QUEDA",
                    "ativo", ativo,
                    "deviceId", deviceId
            );
            mqttPublisher.publish(TOPIC_ALERTA_QUEDA, objectMapper.writeValueAsString(payload));

            System.out.println(ativo
                    ? "🔔 Alarme de queda ACIONADO para " + deviceId
                    : "🔕 Alarme de queda DESLIGADO para " + deviceId);
        } catch (Exception e) {
            System.err.println("✗ Erro ao publicar alerta de queda: " + e.getMessage());
        }
    }
}