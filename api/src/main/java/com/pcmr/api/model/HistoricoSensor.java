package com.pcmr.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "historico_sensor")
public class HistoricoSensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historico")
    private Long idHistorico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_diagnostico", nullable = false)
    private Diagnostico diagnostico;

    @Column(name = "gdh_leitura", nullable = false)
    private OffsetDateTime gdhLeitura;

    @Column(name = "temperatura", precision = 5, scale = 2)
    private BigDecimal temperatura;

    @Column(name = "bpm")
    private Integer bpm;

    @Column(name = "magnitude_g", precision = 5, scale = 2)
    private BigDecimal magnitudeG;

    public Long getIdHistorico() { return idHistorico; }
    public void setIdHistorico(Long idHistorico) { this.idHistorico = idHistorico; }

    public Diagnostico getDiagnostico() { return diagnostico; }
    public void setDiagnostico(Diagnostico diagnostico) { this.diagnostico = diagnostico; }

    public OffsetDateTime getGdhLeitura() { return gdhLeitura; }
    public void setGdhLeitura(OffsetDateTime gdhLeitura) { this.gdhLeitura = gdhLeitura; }

    public BigDecimal getTemperatura() { return temperatura; }
    public void setTemperatura(BigDecimal temperatura) { this.temperatura = temperatura; }

    public Integer getBpm() { return bpm; }
    public void setBpm(Integer bpm) { this.bpm = bpm; }

    public BigDecimal getMagnitudeG() { return magnitudeG; }
    public void setMagnitudeG(BigDecimal magnitudeG) { this.magnitudeG = magnitudeG; }
}