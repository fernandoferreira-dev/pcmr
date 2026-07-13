package com.pcmr.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerta_clinico")
public class AlertaClinico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idAlerta;

    @ManyToOne
    @JoinColumn(name = "id_medico", referencedColumnName = "id_utilizador")
    private Utilizador medico;

    @ManyToOne
    @JoinColumn(name = "id_sensor", referencedColumnName = "id_sensor")
    private Sensor sensor;

    @Column(name = "tipo_alerta")
    private String tipoAlerta;

    @Column(name = "valor_registado")
    private Double valorRegistado;

    private String mensagem;

    @Column(name = "data_hora", insertable = false, updatable = false)
    private LocalDateTime dataHora;

    // Getters e Setters
    public Integer getIdAlerta() { return idAlerta; }
    public void setIdAlerta(Integer idAlerta) { this.idAlerta = idAlerta; }

    public Utilizador getMedico() { return medico; }
    public void setMedico(Utilizador medico) { this.medico = medico; }

    public Sensor getSensor() { return sensor; }
    public void setSensor(Sensor sensor) { this.sensor = sensor; }

    public String getTipoAlerta() { return tipoAlerta; }
    public void setTipoAlerta(String tipoAlerta) { this.tipoAlerta = tipoAlerta; }

    public Double getValorRegistado() { return valorRegistado; }
    public void setValorRegistado(Double valorRegistado) { this.valorRegistado = valorRegistado; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
}