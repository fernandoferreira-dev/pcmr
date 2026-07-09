package com.pcmr.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class HistoricoSensorDTO {
    private OffsetDateTime gdhLeitura;
    private BigDecimal temperatura;
    private Integer bpm;
    private BigDecimal magnitudeG;

    public HistoricoSensorDTO() {}

    public HistoricoSensorDTO(OffsetDateTime gdhLeitura, BigDecimal temperatura, Integer bpm, BigDecimal magnitudeG) {
        this.gdhLeitura = gdhLeitura;
        this.temperatura = temperatura;
        this.bpm = bpm;
        this.magnitudeG = magnitudeG;
    }

    public OffsetDateTime getGdhLeitura() { return gdhLeitura; }
    public void setGdhLeitura(OffsetDateTime gdhLeitura) { this.gdhLeitura = gdhLeitura; }

    public BigDecimal getTemperatura() { return temperatura; }
    public void setTemperatura(BigDecimal temperatura) { this.temperatura = temperatura; }

    public Integer getBpm() { return bpm; }
    public void setBpm(Integer bpm) { this.bpm = bpm; }

    public BigDecimal getMagnitudeG() { return magnitudeG; }
    public void setMagnitudeG(BigDecimal magnitudeG) { this.magnitudeG = magnitudeG; }
}