package com.pcmr.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.mqtt.MqttPublisherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AlertaQuedaBuzzerService {

    private static final String TOPIC_ALERTA_QUEDA = "casa/biometria/alerta";

    @Autowired
    private MqttPublisherService mqttPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Guarda o último estado enviado por dispositivo, para só publicar
    // quando o estado muda (evita spam a cada leitura enquanto a queda
    // se mantém ativa, e garante que o "ativo: false" é sempre enviado
    // assim que o alerta termina).
    private final Map<String, Boolean> estadoAtual = new ConcurrentHashMap<>();

    public void notificarQueda(String deviceId, boolean ativo) {
        Boolean anterior = estadoAtual.put(deviceId, ativo);
        if (anterior != null && anterior == ativo) {
            return; // sem mudança de estado, não repete a publicação
        }

        try {
            Map<String, Object> payload = Map.of(
                    "tipo", "QUEDA",
                    "ativo", ativo,
                    "deviceId", deviceId
            );
            String json = objectMapper.writeValueAsString(payload);
            mqttPublisher.publish(TOPIC_ALERTA_QUEDA, json);

            System.out.println(ativo
                    ? "🔔 Alarme de queda ACIONADO para " + deviceId
                    : "🔕 Alarme de queda DESLIGADO para " + deviceId);
        } catch (Exception e) {
            System.err.println("✗ Erro ao publicar alerta de queda: " + e.getMessage());
        }
    }
}