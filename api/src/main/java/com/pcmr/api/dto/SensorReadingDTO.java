package com.pcmr.api.dto;

public class SensorReadingDTO {
    private double temperatura;
    private int bpm;
    private double magnitudeG;
    private int fallState;
    private boolean alertaQuedaAtivo;

    public double getTemperatura() { return temperatura; }
    public void setTemperatura(double temperatura) { this.temperatura = temperatura; }

    public int getBpm() { return bpm; }
    public void setBpm(int bpm) { this.bpm = bpm; }

    public double getMagnitudeG() { return magnitudeG; }
    public void setMagnitudeG(double magnitudeG) { this.magnitudeG = magnitudeG; }

    public int getFallState() { return fallState; }
    public void setFallState(int fallState) { this.fallState = fallState; }

    public boolean isAlertaQuedaAtivo() { return alertaQuedaAtivo; }
    public void setAlertaQuedaAtivo(boolean alertaQuedaAtivo) { this.alertaQuedaAtivo = alertaQuedaAtivo; }
}