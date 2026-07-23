package com.pcmr.api.dto;

import com.pcmr.api.service.LeituraSensorService;
import java.time.OffsetDateTime;

public class LeituraComEstadoDTO {

    private double temperatura;
    private int bpm;
    private double magnitudeG;
    private int fallState;
    private boolean alertaQuedaAtivo;
    private OffsetDateTime atualizadoEm;

    private EstadoAlertaDTO alertaTemperatura;
    private EstadoAlertaDTO alertaBpm;

    public LeituraComEstadoDTO(LeituraSensorService.LeituraAtual leitura) {
        this.temperatura = leitura.getTemperatura();
        this.bpm = leitura.getBpm();
        this.magnitudeG = leitura.getMagnitudeG();
        this.fallState = leitura.getFallState();
        this.alertaQuedaAtivo = leitura.isAlertaQuedaAtivo();
        this.atualizadoEm = leitura.getAtualizadoEm();
    }

    public double getTemperatura() { return temperatura; }
    public int getBpm() { return bpm; }
    public double getMagnitudeG() { return magnitudeG; }
    public int getFallState() { return fallState; }
    public boolean isAlertaQuedaAtivo() { return alertaQuedaAtivo; }
    public OffsetDateTime getAtualizadoEm() { return atualizadoEm; }

    public EstadoAlertaDTO getAlertaTemperatura() { return alertaTemperatura; }
    public void setAlertaTemperatura(EstadoAlertaDTO alertaTemperatura) { this.alertaTemperatura = alertaTemperatura; }

    public EstadoAlertaDTO getAlertaBpm() { return alertaBpm; }
    public void setAlertaBpm(EstadoAlertaDTO alertaBpm) { this.alertaBpm = alertaBpm; }
}