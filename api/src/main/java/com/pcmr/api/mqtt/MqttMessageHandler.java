package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
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

        if (topic == null) return;

        try {
            
            if (topic.equals("sensor/login")) {
                JsonNode json = objectMapper.readTree(payload);
                int idSensor = json.get("id_sensor").asInt();
                String status = json.get("status").asText();
                
                if ("detectado".equals(status)) {
                    biometriaService.completarDeteccao(idSensor);
                }
                return;
            }
            
            if (topic.equals("sensor/enroll")) {
                JsonNode json = objectMapper.readTree(payload);
                int idSensor = json.get("id_sensor").asInt();
                
                
                biometriaService.completarRegisto(idSensor, true);
                return;
            }

            String deviceId = extrairDeviceId(topic);
            if (deviceId != null) {
                SensorReadingDTO leitura = objectMapper.readValue(payload, SensorReadingDTO.class);
                medicaoService.processarLeitura(deviceId, leitura);
            }
            
        } catch (Exception e) {
            System.err.println("Erro ao processar payload MQTT no tópico '" + topic + "': " + e.getMessage());
        }
    }

    private String extrairDeviceId(String topic) {
        String[] partes = topic.split("/");
        return partes.length >= 2 ? partes[1] : null;
    }
}