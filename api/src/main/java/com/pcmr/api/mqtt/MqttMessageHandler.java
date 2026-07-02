package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.dto.SensorReadingDTO;
import com.pcmr.api.service.BiometriaService;
import com.pcmr.api.service.MedicaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
public class MqttMessageHandler {

    @Autowired
    private MedicaoService medicaoService;

    @Autowired
    private BiometriaService biometriaService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) {
        String payload = message.getPayload().toString();
        String topic = message.getHeaders().get("mqtt_receivedTopic", String.class);

        // --- ROTA BIOMETRIA ---
        // Tópico: casa/biometria/acesso
        // Payload: DETETADO:123, REGISTADO:123, NAO_RECONHECIDO, ERRO_REGISTO, AGUARDAR_DEDO_REGISTO
        if (topic != null && topic.contains("casa/biometria")) {
            biometriaService.processarMensagem(payload);
            return;
        }

        // --- ROTA SENSORES ---
        String deviceId = extrairDeviceId(topic);
        if (deviceId == null) {
            System.err.println("Tópico MQTT sem deviceId reconhecível: " + topic);
            return;
        }

        try {
            SensorReadingDTO leitura = objectMapper.readValue(payload, SensorReadingDTO.class);
            medicaoService.processarLeitura(deviceId, leitura);
        } catch (Exception e) {
            System.err.println("Erro ao processar payload MQTT '" + payload + "': " + e.getMessage());
        }
    }

    // Espera tópicos no formato sensors/{deviceId}/data
    private String extrairDeviceId(String topic) {
        if (topic == null) return null;
        String[] partes = topic.split("/");
        return partes.length >= 2 ? partes[1] : null;
    }
}
