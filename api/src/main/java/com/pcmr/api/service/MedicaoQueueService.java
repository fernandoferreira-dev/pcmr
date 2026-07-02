package com.pcmr.api.service;

import com.pcmr.api.dto.SensorReadingDTO;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.Map;

// Uma fila por deviceId, para que vários sensores possam ter medições ativas em simultâneo
// sem se misturarem entre si.
@Service
public class MedicaoQueueService {

    private final Map<String, ConcurrentLinkedDeque<MedicaoSession>> filas = new ConcurrentHashMap<>();

    public void iniciarSessao(String deviceId, Long medicaoId, Long pacienteId) {
        filas.computeIfAbsent(deviceId, d -> new ConcurrentLinkedDeque<>())
                .addLast(new MedicaoSession(medicaoId, pacienteId));
    }

    public void registarLeitura(String deviceId, SensorReadingDTO leitura) {
        ConcurrentLinkedDeque<MedicaoSession> fila = filas.get(deviceId);
        if (fila == null) return;
        MedicaoSession sessaoAtiva = fila.peekFirst();
        if (sessaoAtiva != null) {
            sessaoAtiva.registarLeitura(leitura);
        }
    }

    public MedicaoSession removerSessaoDoMedicao(String deviceId, Long medicaoId) {
        ConcurrentLinkedDeque<MedicaoSession> fila = filas.get(deviceId);
        if (fila == null) return null;
        MedicaoSession sessao = fila.peekFirst();
        if (sessao != null && sessao.getMedicaoId().equals(medicaoId)) {
            return fila.pollFirst();
        }
        return null;
    }
}