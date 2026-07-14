package com.pcmr.api.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
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

    public static class MediaLeituras {
        public double temperaturaMedia;
        public int bpmMedio;
        public double magnitudeGMedia;
        public int numeroLeituras;
        public boolean alertaQuedaOcorreu;
    }

    public static class PontoHistoricoMemory {
        public double temperatura;
        public int bpm;
        public double magnitudeG;
        public OffsetDateTime gdhLeitura;
    }

    private static class Acumulador {
        private double somaTemperatura;
        private long somaBpm;
        private double somaMagnitudeG;
        private int contagem;
        private boolean alertaQuedaOcorreu;
        private final List<PontoHistoricoMemory> historico = new ArrayList<>();

        synchronized void adicionar(SensorReadingDTOWrapper l) {
            somaTemperatura += l.temperatura;
            somaBpm += l.bpm;
            somaMagnitudeG += l.magnitudeG;
            contagem++;
            if (l.alertaQuedaAtivo) alertaQuedaOcorreu = true;

            PontoHistoricoMemory ponto = new PontoHistoricoMemory();
            ponto.temperatura = l.temperatura;
            ponto.bpm = l.bpm;
            ponto.magnitudeG = l.magnitudeG;
            ponto.gdhLeitura = OffsetDateTime.now();
            historico.add(ponto);
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

        synchronized List<PontoHistoricoMemory> getHistorico() {
            return new ArrayList<>(historico);
        }
    }

    private final Map<String, LeituraAtual> leiturasPorDispositivo = new ConcurrentHashMap<>();
    private final Map<String, Acumulador> acumuladoresPorDispositivo = new ConcurrentHashMap<>();
    
    private final Map<String, Boolean> diagnosticosAtivos = new ConcurrentHashMap<>();

    public void iniciarDiagnostico(String deviceId) {
        diagnosticosAtivos.put(deviceId, true);
        limparAcumulador(deviceId);
        System.out.println("Diagnóstico INICIADO e acumulador limpo para o dispositivo: " + deviceId);
    }

    public void pararDiagnostico(String deviceId) {
        diagnosticosAtivos.put(deviceId, false);
        System.out.println("Diagnóstico PARADO para o dispositivo: " + deviceId);
    }

    public boolean isDiagnosticoAtivo(String deviceId) {
        return diagnosticosAtivos.getOrDefault(deviceId, false);
    }

    public void registarLeitura(String deviceId, SensorReadingDTOWrapper leitura) {
        LeituraAtual atual = new LeituraAtual();
        atual.temperatura = leitura.temperatura;
        atual.bpm = leitura.bpm;
        atual.magnitudeG = leitura.magnitudeG;
        atual.fallState = leitura.fallState;
        atual.alertaQuedaAtivo = leitura.alertaQuedaAtivo;
        atual.atualizadoEm = OffsetDateTime.now();
        leiturasPorDispositivo.put(deviceId, atual);

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

    public List<PontoHistoricoMemory> getLeiturasBrutas(String deviceId) {
        Acumulador acumulador = acumuladoresPorDispositivo.get(deviceId);
        return acumulador != null ? acumulador.getHistorico() : Collections.emptyList();
    }

    public void limparAcumulador(String deviceId) {
        acumuladoresPorDispositivo.remove(deviceId);
    }
}