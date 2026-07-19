package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.dto.SensorReadingDTO;
import com.pcmr.api.service.AlertaMonitorService;
import com.pcmr.api.service.AlertaQuedaBuzzerService;
import com.pcmr.api.service.AtividadeSensorService;
import com.pcmr.api.service.BiometriaService;
import com.pcmr.api.service.LeituraSensorService;
import com.pcmr.api.service.PresencaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
public class MqttMessageHandler {

    private final LeituraSensorService leituraSensorService;
    private final BiometriaService biometriaService;
    private final PresencaService presencaService;
    private final AtividadeSensorService atividadeSensorService;
    private final AlertaMonitorService alertaMonitorService;
    private final MqttSecurityService mqttSecurityService;
    private final AlertaQuedaBuzzerService alertaQuedaBuzzerService;

    private static final String DEVICE_ID_NODE1 = "node1-presenca";
    private static final String DEVICE_ID_NODE3 = "esp32-pico-fingerprint";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public MqttMessageHandler(LeituraSensorService leituraSensorService,
                              BiometriaService biometriaService,
                              PresencaService presencaService,
                              AtividadeSensorService atividadeSensorService,
                              AlertaMonitorService alertaMonitorService,
                              MqttSecurityService mqttSecurityService,
                              AlertaQuedaBuzzerService alertaQuedaBuzzerService) {
        this.leituraSensorService = leituraSensorService;
        this.biometriaService = biometriaService;
        this.presencaService = presencaService;
        this.atividadeSensorService = atividadeSensorService;
        this.alertaMonitorService = alertaMonitorService;
        this.mqttSecurityService = mqttSecurityService;
        this.alertaQuedaBuzzerService = alertaQuedaBuzzerService;
    }

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) {
        String payloadBruto = message.getPayload().toString();
        String topic = message.getHeaders().get("mqtt_receivedTopic", String.class);

        if (topic == null) {
            return;
        }

        if (topic.contains("/status")) {
            System.out.println("ℹ Mensagem de status ignorada (não processada): " + topic);
            return;
        }

        String payload;

        // Decifrar e validar a mensagem MQTT
        try {
            payload = mqttSecurityService.desempacotarEDecifrar(payloadBruto);
        } catch (Exception e) {
            System.err.println(
                    "Erro ao decifrar/validar mensagem MQTT no tópico '"
                            + topic + "': " + e.getMessage()
            );
            return; // descarta mensagens inválidas
        }

        try {
            // Nó de presença
            if (topic.equals("sensors/node1/presenca")) {
                atividadeSensorService.registarAtividade(DEVICE_ID_NODE1);

                JsonNode json = objectMapper.readTree(payload);
                boolean presente = json.get("presente").asBoolean();

                presencaService.atualizarPresenca(presente);

                System.out.println(
                        (presente ? "✓ Paciente presente" : "✗ Paciente ausente")
                                + " (Nó 1)"
                );
                return;
            }

            // Login biométrico
            if (topic.equals("sensor/login")) {
                atividadeSensorService.registarAtividade(DEVICE_ID_NODE3);

                JsonNode json = objectMapper.readTree(payload);
                int idSensor = json.get("id_sensor").asInt();
                String status = json.get("status").asText();

                if ("detectado".equals(status)) {
                    biometriaService.completarDeteccao(idSensor);
                }
                return;
            }

            // Registo biométrico
            if (topic.equals("sensor/enroll")) {
                atividadeSensorService.registarAtividade(DEVICE_ID_NODE3);

                JsonNode json = objectMapper.readTree(payload);

                if (json.has("erro") && json.get("erro").asBoolean()) {
                    String motivo = json.has("motivo")
                            ? json.get("motivo").asText()
                            : "desconhecido";

                    System.err.println(
                            "✗ Enroll falhou no ESP32. Motivo: " + motivo
                    );

                    biometriaService.completarRegisto(-1, false);
                    return;
                }

                int idSensor = json.get("id_sensor").asInt();
                biometriaService.completarRegisto(idSensor, true);
                return;
            }

            // Leituras dos sensores
            String deviceId = extrairDeviceId(topic);

            if (deviceId != null) {
                SensorReadingDTO leitura =
                        objectMapper.readValue(payload, SensorReadingDTO.class);

                LeituraSensorService.SensorReadingDTOWrapper wrapper =
                        new LeituraSensorService.SensorReadingDTOWrapper();

                wrapper.temperatura = leitura.getTemperatura();
                wrapper.bpm = leitura.getBpm();
                wrapper.magnitudeG = leitura.getMagnitudeG();
                wrapper.fallState = leitura.getFallState();
                wrapper.alertaQuedaAtivo = leitura.isAlertaQuedaAtivo();

                leituraSensorService.registarLeitura(deviceId, wrapper);

                atividadeSensorService.registarAtividade(DEVICE_ID_NODE1);

                alertaMonitorService.avaliarLimites(
                        deviceId,
                        wrapper.temperatura,
                        wrapper.bpm
                );

                // NOVO: aciona/desliga o buzzer do Nó 3 consoante o estado de queda
                // reportado pelo wearable, independentemente da app estar aberta.
                alertaQuedaBuzzerService.notificarQueda(deviceId, wrapper.alertaQuedaAtivo);
            }

        } catch (Exception e) {
            System.err.println(
                    "Erro ao processar payload MQTT no tópico '"
                            + topic + "': " + e.getMessage()
            );
        }
    }

    private String extrairDeviceId(String topic) {
        String[] partes = topic.split("/");
        return partes.length >= 2 ? partes[1] : null;
    }
}