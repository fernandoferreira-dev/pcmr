package com.pcmr.api.mqtt;

import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
public class MqttMessageHandler {

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) {
        String payload = message.getPayload().toString();
        String topic = message.getHeaders()
                              .get("mqtt_receivedTopic", String.class);

        System.out.println("Tópico: " + topic);
        System.out.println("Payload: " + payload);

        // https://www.youtube.com/watch?v=KK5uGdYGo80
    }
}