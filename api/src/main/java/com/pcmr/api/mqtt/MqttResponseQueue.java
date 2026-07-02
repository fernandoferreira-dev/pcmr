package com.pcmr.api.mqtt;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MqttResponseQueue {
    private final Map<String, CompletableFuture<String>> pending = new ConcurrentHashMap<>();

    public CompletableFuture<String> register(String correlationId) {
        CompletableFuture<String> future = new CompletableFuture<>();
        pending.put(correlationId, future);
        return future;
    }

    public void resolve(String correlationId, String payload) {
        CompletableFuture<String> future = pending.remove(correlationId);
        if (future != null) future.complete(payload);
    }
}
