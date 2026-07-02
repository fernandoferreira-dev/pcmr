package com.pcmr.api.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
public class MqttPublisherService {

    @Value("${MQTT_BROKER_URL:tcp://localhost:1883}")
    private String brokerUrl;

    private MqttClient client;

    @PostConstruct
    public void init() {
        try {
            client = new MqttClient(brokerUrl, "spring-publisher-" + System.currentTimeMillis());
            MqttConnectOptions opts = new MqttConnectOptions();
            opts.setAutomaticReconnect(true);
            opts.setCleanSession(true);
            client.connect(opts);
            System.out.println("✓ MqttPublisherService ligado ao broker: " + brokerUrl);
        } catch (Exception e) {
            System.err.println("✗ Erro ao ligar MqttPublisherService: " + e.getMessage());
        }
    }

    public void publish(String topic, String payload) {
        if (client == null || !client.isConnected()) {
            System.err.println("MqttPublisherService não está ligado ao broker");
            return;
        }
        try {
            MqttMessage message = new MqttMessage(payload.getBytes());
            message.setQos(1);
            client.publish(topic, message);
            System.out.println("✓ Publicado MQTT [" + topic + "]: " + payload);
        } catch (Exception e) {
            System.err.println("✗ Erro ao publicar MQTT: " + e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
                client.close();
            }
        } catch (Exception ignored) {}
    }
}
