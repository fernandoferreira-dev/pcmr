package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.dto.SensorReadingDTO;
import com.pcmr.api.service.BiometriaService;
import com.pcmr.api.service.LeituraSensorService;
import com.pcmr.api.service.PresencaService; // Certifica-te que este import corresponde ao teu projeto
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
public class MqttMessageHandler {

    @Autowired
    private LeituraSensorService leituraSensorService;

    @Autowired
    private BiometriaService biometriaService;

    @Autowired
    private PresencaService presencaService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) {
        String payload = message.getPayload().toString();
        String topic = message.getHeaders().get("mqtt_receivedTopic", String.class);

        if (topic == null) return;

        try {
            // Nova melhoria: Deteção de Presença
            if (topic.equals("sensors/node1/presenca")) {
                JsonNode json = objectMapper.readTree(payload);
                boolean presente = json.get("presente").asBoolean();
                presencaService.atualizarPresenca(presente);
                System.out.println((presente ? "✓ Paciente presente" : "✗ Paciente ausente") + " (Nó 1)");
                return;
            }

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

                if (json.has("erro") && json.get("erro").asBoolean()) {
                    String motivo = json.has("motivo") ? json.get("motivo").asText() : "desconhecido";
                    System.err.println("✗ Enroll falhou no ESP32. Motivo: " + motivo);
                    biometriaService.completarRegisto(-1, false);
                    return;
                }

                int idSensor = json.get("id_sensor").asInt();
                biometriaService.completarRegisto(idSensor, true);
                return;
            }

            String deviceId = extrairDeviceId(topic);
            if (deviceId != null) {
                SensorReadingDTO leitura = objectMapper.readValue(payload, SensorReadingDTO.class);

                LeituraSensorService.SensorReadingDTOWrapper wrapper = new LeituraSensorService.SensorReadingDTOWrapper();
                wrapper.temperatura = leitura.getTemperatura();
                wrapper.bpm = leitura.getBpm();
                wrapper.magnitudeG = leitura.getMagnitudeG();
                wrapper.fallState = leitura.getFallState();
                wrapper.alertaQuedaAtivo = leitura.isAlertaQuedaAtivo();

                leituraSensorService.registarLeitura(deviceId, wrapper);
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