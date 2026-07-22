package com.pcmr.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.mqtt.MqttPublisherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VentoinhaRelayService {

    private static final String TOPIC_RELAY_VENTOINHA = "sensors/wearable01/relay/ventoinha";

    @Autowired
    private MqttPublisherService mqttPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Boolean> estadoAtual = new ConcurrentHashMap<>();

    public void avaliarTemperatura(String deviceId, double temperatura, double limite) {
        boolean deveLigar = temperatura > limite;
        Boolean anterior = estadoAtual.put(deviceId, deveLigar);
        if (anterior != null && anterior == deveLigar) {
            return;
        }

        try {
            Map<String, Object> payload = Map.of(
                    "ativo", deveLigar,
                    "deviceId", deviceId,
                    "temperatura", temperatura
            );
            mqttPublisher.publish(TOPIC_RELAY_VENTOINHA, objectMapper.writeValueAsString(payload));
            System.out.println(deveLigar
                    ? "Ventoinha LIGADA (" + temperatura + "°C > " + limite + "°C)"
                    : "Ventoinha DESLIGADA");
        } catch (Exception e) {
            System.err.println("✗ Erro ao publicar comando da ventoinha: " + e.getMessage());
        }
    }
}