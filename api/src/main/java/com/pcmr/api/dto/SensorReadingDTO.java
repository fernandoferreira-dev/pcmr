package com.pcmr.api.dto;

public class SensorReadingDTO {
    private Double bpm;
    private Double temperatura;
    private Double humidade;

    public Double getBpm() { return bpm; }
    public void setBpm(Double bpm) { this.bpm = bpm; }

    public Double getTemperatura() { return temperatura; }
    public void setTemperatura(Double temperatura) { this.temperatura = temperatura; }

    public Double getHumidade() { return humidade; }
    public void setHumidade(Double humidade) { this.humidade = humidade; }
}