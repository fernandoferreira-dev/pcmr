package com.pcmr.api.dto;

public class AlertaRequestDTO {
    private Integer idMedico;
    private String deviceId;
    private String tipoAlerta;
    private Double valorRegistado;
    private String mensagem;

    // Getters e Setters
    public Integer getIdMedico() { return idMedico; }
    public void setIdMedico(Integer idMedico) { this.idMedico = idMedico; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getTipoAlerta() { return tipoAlerta; }
    public void setTipoAlerta(String tipoAlerta) { this.tipoAlerta = tipoAlerta; }

    public Double getValorRegistado() { return valorRegistado; }
    public void setValorRegistado(Double valorRegistado) { this.valorRegistado = valorRegistado; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }
}