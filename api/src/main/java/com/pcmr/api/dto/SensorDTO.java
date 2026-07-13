package com.pcmr.api.dto;

public class SensorDTO {
    private Long idSensor;
    private String nome;
    private String localizacao;
    private String estado;
    private String tipoMetrica;

    public SensorDTO() {}

    public SensorDTO(Long idSensor, String nome, String localizacao, String estado, String tipoMetrica) {
        this.idSensor = idSensor;
        this.nome = nome;
        this.localizacao = localizacao;
        this.estado = estado;
        this.tipoMetrica = tipoMetrica;
    }

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