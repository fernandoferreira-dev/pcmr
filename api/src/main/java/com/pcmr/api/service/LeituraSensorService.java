package com.pcmr.api.service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class LeituraSensorService {

    public static class LeituraAtual {

        public double temperatura;
        public int bpm;
        public double magnitudeG;
        public int fallState;
        public boolean alertaQuedaAtivo;
        public OffsetDateTime atualizadoEm;

        public double getTemperatura() {
            return temperatura;
        }

        public int getBpm() {
            return bpm;
        }

        public double getMagnitudeG() {
            return magnitudeG;
        }

        public int getFallState() {
            return fallState;
        }

        public boolean isAlertaQuedaAtivo() {
            return alertaQuedaAtivo;
        }

        public OffsetDateTime getAtualizadoEm() {
            return atualizadoEm;
        }
    }

    public static class SensorReadingDTOWrapper {

        public double temperatura;
        public int bpm;
        public double magnitudeG;
        public int fallState;
        public boolean alertaQuedaAtivo;
    }

    public static class MediaLeituras {

        public double temperaturaMedia;
        public int bpmMedio;
        public double magnitudeGMedia;
        public int numeroLeituras;
        public boolean alertaQuedaOcorreu;
    }

    // Acumulador thread-safe: guarda somas + contagem (valores numéricos),
    // e uma flag à parte para quedas (não entra na média)
    private static class Acumulador {

        private double somaTemperatura;
        private long somaBpm;
        private double somaMagnitudeG;
        private int contagem;
        private boolean alertaQuedaOcorreu;

        synchronized void adicionar(SensorReadingDTOWrapper l) {
            somaTemperatura += l.temperatura;
            somaBpm += l.bpm;
            somaMagnitudeG += l.magnitudeG;
            contagem++;
            if (l.alertaQuedaAtivo) alertaQuedaOcorreu = true;
        }

        synchronized MediaLeituras calcularMedia() {
            if (contagem == 0) return null;
            MediaLeituras m = new MediaLeituras();
            m.temperaturaMedia = somaTemperatura / contagem;
            m.bpmMedio = (int) Math.round((double) somaBpm / contagem);
            m.magnitudeGMedia = somaMagnitudeG / contagem;
            m.numeroLeituras = contagem;
            m.alertaQuedaOcorreu = alertaQuedaOcorreu;
            return m;
        }
    }

    private final Map<String, LeituraAtual> leiturasPorDispositivo =
        new ConcurrentHashMap<>();
    private final Map<String, Acumulador> acumuladoresPorDispositivo =
        new ConcurrentHashMap<>();

    public void registarLeitura(
        String deviceId,
        SensorReadingDTOWrapper leitura
    ) {
        LeituraAtual atual = new LeituraAtual();
        atual.temperatura = leitura.temperatura;
        atual.bpm = leitura.bpm;
        atual.magnitudeG = leitura.magnitudeG;
        atual.fallState = leitura.fallState;
        atual.alertaQuedaAtivo = leitura.alertaQuedaAtivo;
        atual.atualizadoEm = OffsetDateTime.now();
        leiturasPorDispositivo.put(deviceId, atual); // continua a servir o live view

        acumuladoresPorDispositivo
            .computeIfAbsent(deviceId, id -> new Acumulador())
            .adicionar(leitura);
    }

    public LeituraAtual getUltimaLeitura(String deviceId) {
        return leiturasPorDispositivo.get(deviceId);
    }

    public MediaLeituras getMediaLeituras(String deviceId) {
        Acumulador acumulador = acumuladoresPorDispositivo.get(deviceId);
        return acumulador != null ? acumulador.calcularMedia() : null;
    }

    public void limparAcumulador(String deviceId) {
        acumuladoresPorDispositivo.remove(deviceId);
    }
}
