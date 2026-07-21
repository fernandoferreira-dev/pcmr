package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.dto.SensorReadingDTO;
import com.pcmr.api.model.Notification;
import com.pcmr.api.service.AlertaMonitorService;
import com.pcmr.api.service.AlertaQuedaBuzzerService;
import com.pcmr.api.service.AtividadeSensorService;
import com.pcmr.api.service.BiometriaService;
import com.pcmr.api.service.LeituraSensorService;
import com.pcmr.api.service.NotificationService;
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
    private final NotificationService notificationService;

    private static final String DEVICE_ID_NODE1 = "node1-presenca";
    private static final String DEVICE_ID_NODE3 = "esp32-pico-fingerprint";

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Limites de segurança para avaliação de leituras
    private static final int BPM_WARNING_MIN = 50;
    private static final int BPM_WARNING_MAX = 110;
    private static final int BPM_CRITICAL_MIN = 40;
    private static final int BPM_CRITICAL_MAX = 130;

    private static final double TEMP_WARNING_MIN = 35.5;
    private static final double TEMP_WARNING_MAX = 38.0;
    private static final double TEMP_CRITICAL_MIN = 34.5;
    private static final double TEMP_CRITICAL_MAX = 39.5;

    @Autowired
    public MqttMessageHandler(LeituraSensorService leituraSensorService,
                              BiometriaService biometriaService,
                              PresencaService presencaService,
                              AtividadeSensorService atividadeSensorService,
                              AlertaMonitorService alertaMonitorService,
                              MqttSecurityService mqttSecurityService,
                              AlertaQuedaBuzzerService alertaQuedaBuzzerService,
                              NotificationService notificationService) {
        this.leituraSensorService = leituraSensorService;
        this.biometriaService = biometriaService;
        this.presencaService = presencaService;
        this.atividadeSensorService = atividadeSensorService;
        this.alertaMonitorService = alertaMonitorService;
        this.mqttSecurityService = mqttSecurityService;
        this.alertaQuedaBuzzerService = alertaQuedaBuzzerService;
        this.notificationService = notificationService;
    }

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) {
        String payloadBruto = message.getPayload().toString();
        String topic = message.getHeaders().get("mqtt_receivedTopic", String.class);

        if (topic == null) {
            return;
        }

        // ================= STATUS MONITORING =================
        if (topic.endsWith("/status")) {
            String deviceId = extrairDeviceId(topic);
            if (deviceId != null) {
                System.out.println("⚠️ [MQTT STATUS] O dispositivo '" + deviceId + "' reportou estado: " + payloadBruto);
                
                atividadeSensorService.registarAtividade(deviceId);

                if ("OFFLINE".equalsIgnoreCase(payloadBruto)) {
                    leituraSensorService.pararDiagnostico(deviceId);
                }
            }
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
            return; 
        }

        try {
            // ================= NODE 1: PRESENÇA =================
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

            // ================= BIOMETRIA (LOGIN) =================
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

            // ================= BIOMETRIA (ENROLL) =================
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

            // ================= WEARABLE DATA (DIAGNÓSTICO OBRIGATÓRIO) =================
            String deviceId = extrairDeviceId(topic);

            if (deviceId != null) {
                atividadeSensorService.registarAtividade(deviceId);

                System.out.println("📥 [MQTT RECEBIDO] Tópico: " + topic + " | DeviceID extraído: " + deviceId + " | Diagnóstico Ativo? " + leituraSensorService.isDiagnosticoAtivo(deviceId));

                // 2. Valida se o diagnóstico está ativo no LeituraSensorService para este ID
                if (!leituraSensorService.isDiagnosticoAtivo(deviceId)) {
                    System.out.println("ℹ️ [DIAGNÓSTICO INATIVO] Dados de '" + deviceId + "' ignorados. Ative o diagnóstico clicando em 'Sim' no ecrã.");
                    return;
                }

                SensorReadingDTO leitura =
                        objectMapper.readValue(payload, SensorReadingDTO.class);

                LeituraSensorService.SensorReadingDTOWrapper wrapper =
                        new LeituraSensorService.SensorReadingDTOWrapper();

                wrapper.temperatura = leitura.getTemperatura();
                wrapper.bpm = leitura.getBpm();
                wrapper.magnitudeG = leitura.getMagnitudeG();
                wrapper.fallState = leitura.getFallState();
                wrapper.alertaQuedaAtivo = leitura.isAlertaQuedaAtivo();

                // Grava o ponto de leitura na memória
                leituraSensorService.registarLeitura(deviceId, wrapper);

                // Regista a atividade do nó central que retransmitiu os dados
                atividadeSensorService.registarAtividade(DEVICE_ID_NODE1);

                // Avalia limites legados/monitorização interna
                alertaMonitorService.avaliarLimites(
                        deviceId,
                        wrapper.temperatura,
                        wrapper.bpm
                );

                // Aciona/desliga o buzzer do Nó 3 consoante o estado de queda reportado
                alertaQuedaBuzzerService.notificarQueda(deviceId, wrapper.alertaQuedaAtivo);

                // Dispara notificações detalhadas baseadas nos limiares críticos/avisos
                avaliarLeitura(deviceId, leitura);
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

    private void avaliarLeitura(String deviceId, SensorReadingDTO leitura) {
        int bpm = leitura.getBpm();
        double temperatura = leitura.getTemperatura();

        if (leitura.isAlertaQuedaAtivo()) {
            notificationService.criarNotificacao(
                    "Possível queda detetada",
                    String.format("O sensor '%s' detetou uma possível queda (magnitude %.2fG). Verifique o paciente imediatamente.", deviceId, leitura.getMagnitudeG()),
                    deviceId,
                    Notification.Severidade.CRITICAL
            );
        }

        // Frequência cardíaca (bpm)
        if (bpm > 0) {
            if (bpm < BPM_CRITICAL_MIN || bpm > BPM_CRITICAL_MAX) {
                notificationService.criarNotificacao(
                        "Frequência cardíaca crítica",
                        String.format("O sensor '%s' registou %d bpm, fora do intervalo seguro (%d-%d bpm).", deviceId, bpm, BPM_CRITICAL_MIN, BPM_CRITICAL_MAX),
                        deviceId,
                        Notification.Severidade.CRITICAL
                );
            } else if (bpm < BPM_WARNING_MIN || bpm > BPM_WARNING_MAX) {
                notificationService.criarNotificacao(
                        "Frequência cardíaca anómala",
                        String.format("O sensor '%s' registou %d bpm, fora do intervalo normal (%d-%d bpm).", deviceId, bpm, BPM_WARNING_MIN, BPM_WARNING_MAX),
                        deviceId,
                        Notification.Severidade.WARNING
                );
            }
        }

        // Temperatura corporal
        if (temperatura > 0) {
            if (temperatura < TEMP_CRITICAL_MIN || temperatura > TEMP_CRITICAL_MAX) {
                notificationService.criarNotificacao(
                        "Temperatura corporal crítica",
                        String.format("O sensor '%s' registou %.1f°C, fora do intervalo seguro (%.1f-%.1f°C).", deviceId, temperatura, TEMP_CRITICAL_MIN, TEMP_CRITICAL_MAX),
                        deviceId,
                        Notification.Severidade.CRITICAL
                );
            } else if (temperatura < TEMP_WARNING_MIN || temperatura > TEMP_WARNING_MAX) {
                notificationService.criarNotificacao(
                        "Temperatura corporal anómala",
                        String.format("O sensor '%s' registou %.1f°C, fora do intervalo normal (%.1f-%.1f°C).", deviceId, temperatura, TEMP_WARNING_MIN, TEMP_WARNING_MAX),
                        deviceId,
                        Notification.Severidade.WARNING
                );
            }
        }
    }
}