package com.pcmr.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "diagnostico")
public class Diagnostico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_diagnostico")
    private Long idDiagnostico;

    @ManyToOne
    @JoinColumn(name = "id_consulta", nullable = false)
    private Consulta consulta;

    @ManyToOne
    @JoinColumn(name = "id_sensor", nullable = false)
    private Sensor sensor;

    @Column(name = "gdh_diagnostico", nullable = false)
    private OffsetDateTime gdhDiagnostico = OffsetDateTime.now();

    @Column(name = "temperatura")
    private BigDecimal temperatura;

    @Column(name = "bpm")
    private Integer bpm;

    @Column(name = "magnitude_g")
    private BigDecimal magnitudeG;

    @Column(name = "relacao_causa_efeito")
    private String relacaoCausaEfeito;

    public Long getIdDiagnostico() { return idDiagnostico; }
    public void setIdDiagnostico(Long idDiagnostico) { this.idDiagnostico = idDiagnostico; }

    public Consulta getConsulta() { return consulta; }
    public void setConsulta(Consulta consulta) { this.consulta = consulta; }

    public Sensor getSensor() { return sensor; }
    public void setSensor(Sensor sensor) { this.sensor = sensor; }

    public OffsetDateTime getGdhDiagnostico() { return gdhDiagnostico; }
    public void setGdhDiagnostico(OffsetDateTime gdhDiagnostico) { this.gdhDiagnostico = gdhDiagnostico; }

    public BigDecimal getTemperatura() { return temperatura; }
    public void setTemperatura(BigDecimal temperatura) { this.temperatura = temperatura; }

    public Integer getBpm() { return bpm; }
    public void setBpm(Integer bpm) { this.bpm = bpm; }

    public BigDecimal getMagnitudeG() { return magnitudeG; }
    public void setMagnitudeG(BigDecimal magnitudeG) { this.magnitudeG = magnitudeG; }

    public String getRelacaoCausaEfeito() { return relacaoCausaEfeito; }
    public void setRelacaoCausaEfeito(String relacaoCausaEfeito) { this.relacaoCausaEfeito = relacaoCausaEfeito; }
}