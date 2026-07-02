package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.dto.SensorReadingDTO;
import com.pcmr.api.service.MedicaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
public class MqttMessageHandler {

    @Autowired
    private MedicaoService medicaoService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) {
        String payload = message.getPayload().toString();
        String topic = message.getHeaders().get("mqtt_receivedTopic", String.class);

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