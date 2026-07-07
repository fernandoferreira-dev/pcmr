package com.pcmr.api.service;

import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LeituraSensorService {

    public static class LeituraAtual {
        public double temperatura;
        public int bpm;
        public double magnitudeG;
        public int fallState;
        public boolean alertaQuedaAtivo;
        public OffsetDateTime atualizadoEm;

        public double getTemperatura() { return temperatura; }
        public int getBpm() { return bpm; }
        public double getMagnitudeG() { return magnitudeG; }
        public int getFallState() { return fallState; }
        public boolean isAlertaQuedaAtivo() { return alertaQuedaAtivo; }
        public OffsetDateTime getAtualizadoEm() { return atualizadoEm; }
    }

    public static class SensorReadingDTOWrapper {
        public double temperatura;
        public int bpm;
        public double magnitudeG;
        public int fallState;
        public boolean alertaQuedaAtivo;
    }

    private final Map<String, LeituraAtual> leiturasPorDispositivo = new ConcurrentHashMap<>();

    public void registarLeitura(String deviceId, SensorReadingDTOWrapper leitura) {
        LeituraAtual atual = new LeituraAtual();
        atual.temperatura = leitura.temperatura;
        atual.bpm = leitura.bpm;
        atual.magnitudeG = leitura.magnitudeG;
        atual.fallState = leitura.fallState;
        atual.alertaQuedaAtivo = leitura.alertaQuedaAtivo;
        atual.atualizadoEm = OffsetDateTime.now();
        leiturasPorDispositivo.put(deviceId, atual);
    }

    public LeituraAtual getUltimaLeitura(String deviceId) {
        return leiturasPorDispositivo.get(deviceId);
    }
}