package com.pcmr.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Medicao")
public class Medicao {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @Column(nullable = false)
    private String deviceId;

    @Enumerated(EnumType.STRING)
    private EstadoMedicao estado = EstadoMedicao.EM_CURSO;

    private Double bpmMedio;
    private Double temperaturaMedia;
    private Double humidadeMedia;
    private Integer numAmostras = 0;
    private Integer duracaoSegundos;

    private LocalDateTime iniciadoEm = LocalDateTime.now();
    private LocalDateTime concluidoEm;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public EstadoMedicao getEstado() { return estado; }
    public void setEstado(EstadoMedicao estado) { this.estado = estado; }

    public Double getBpmMedio() { return bpmMedio; }
    public void setBpmMedio(Double bpmMedio) { this.bpmMedio = bpmMedio; }

    public Double getTemperaturaMedia() { return temperaturaMedia; }
    public void setTemperaturaMedia(Double temperaturaMedia) { this.temperaturaMedia = temperaturaMedia; }

    public Double getHumidadeMedia() { return humidadeMedia; }
    public void setHumidadeMedia(Double humidadeMedia) { this.humidadeMedia = humidadeMedia; }

    public Integer getNumAmostras() { return numAmostras; }
    public void setNumAmostras(Integer numAmostras) { this.numAmostras = numAmostras; }

    public Integer getDuracaoSegundos() { return duracaoSegundos; }
    public void setDuracaoSegundos(Integer duracaoSegundos) { this.duracaoSegundos = duracaoSegundos; }

    public LocalDateTime getIniciadoEm() { return iniciadoEm; }
    public void setIniciadoEm(LocalDateTime iniciadoEm) { this.iniciadoEm = iniciadoEm; }

    public LocalDateTime getConcluidoEm() { return concluidoEm; }
    public void setConcluidoEm(LocalDateTime concluidoEm) { this.concluidoEm = concluidoEm; }
}