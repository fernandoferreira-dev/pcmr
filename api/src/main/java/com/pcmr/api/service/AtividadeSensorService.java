package com.pcmr.api.service;

import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AtividadeSensorService {

    private final Map<String, OffsetDateTime> ultimaAtividade = new ConcurrentHashMap<>();

    public void registarAtividade(String deviceId) {
        if (deviceId == null) return;
        ultimaAtividade.put(deviceId, OffsetDateTime.now());
    }

    public OffsetDateTime getUltimaAtividade(String deviceId) {
        return ultimaAtividade.get(deviceId);
    }
}