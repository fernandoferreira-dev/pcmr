package com.pcmr.api.model;

import jakarta.persistence.*;

@Entity
@Table(name = "sensor")
public class Sensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sensor")
    private Long idSensor;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "localizacao")
    private String localizacao;

    @Column(name = "estado", nullable = false)
    private String estado = "ATIVO";

    @Column(name = "tipo_metrica", nullable = false)
    private String tipoMetrica = "GENERICO"; // WEARABLE | PRESENCA | BIOMETRICO | GENERICO

    public Long getIdSensor() { return idSensor; }
    public void setIdSensor(Long idSensor) { this.idSensor = idSensor; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getLocalizacao() { return localizacao; }
    public void setLocalizacao(String localizacao) { this.localizacao = localizacao; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getTipoMetrica() { return tipoMetrica; }
    public void setTipoMetrica(String tipoMetrica) { this.tipoMetrica = tipoMetrica; }
}