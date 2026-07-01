package com.pcmr.api.service;

import com.pcmr.api.dto.SensorReadingDTO;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

// Estado em memória de uma medição enquanto está ativa (não é persistido diretamente)
public class MedicaoSession {

    private final Long medicaoId;
    private final Long pacienteId;
    private final Instant iniciadoEm = Instant.now();

    private final List<Double> bpms = new CopyOnWriteArrayList<>();
    private final List<Double> temperaturas = new CopyOnWriteArrayList<>();
    private final List<Double> humidades = new CopyOnWriteArrayList<>();

    public MedicaoSession(Long medicaoId, Long pacienteId) {
        this.medicaoId = medicaoId;
        this.pacienteId = pacienteId;
    }

    public void registarLeitura(SensorReadingDTO leitura) {
        if (leitura.getBpm() != null) bpms.add(leitura.getBpm());
        if (leitura.getTemperatura() != null) temperaturas.add(leitura.getTemperatura());
        if (leitura.getHumidade() != null) humidades.add(leitura.getHumidade());
    }

    public Long getMedicaoId() { return medicaoId; }
    public Long getPacienteId() { return pacienteId; }
    public Instant getIniciadoEm() { return iniciadoEm; }
    public List<Double> getBpms() { return bpms; }
    public List<Double> getTemperaturas() { return temperaturas; }
    public List<Double> getHumidades() { return humidades; }
}