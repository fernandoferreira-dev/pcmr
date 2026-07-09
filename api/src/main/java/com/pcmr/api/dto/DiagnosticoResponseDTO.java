package com.pcmr.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class DiagnosticoResponseDTO {
    private Long id;
    private String patient;
    private OffsetDateTime date;
    private String status; 
    private BigDecimal temperatura;
    private Integer bpm;
    private BigDecimal magnitudeG;
    private String relacaoCausaEfeito;

    public DiagnosticoResponseDTO() {}

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPatient() { return patient; }
    public void setPatient(String patient) { this.patient = patient; }

    public OffsetDateTime getDate() { return date; }
    public void setDate(OffsetDateTime date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getTemperatura() { return temperatura; }
    public void setTemperatura(BigDecimal temperatura) { this.temperatura = temperatura; }

    public Integer getBpm() { return bpm; }
    public void setBpm(Integer bpm) { this.bpm = bpm; }

    public BigDecimal getMagnitudeG() { return magnitudeG; }
    public void setMagnitudeG(BigDecimal magnitudeG) { this.magnitudeG = magnitudeG; }

    public String getRelacaoCausaEfeito() { return relacaoCausaEfeito; }
    public void setRelacaoCausaEfeito(String relacaoCausaEfeito) { this.relacaoCausaEfeito = relacaoCausaEfeito; }
}