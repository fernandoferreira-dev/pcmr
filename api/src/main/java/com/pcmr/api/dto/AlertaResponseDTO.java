package com.pcmr.api.dto;

public class AlertaResponseDTO {
    private Integer idAlerta;
    private String tipoAlerta;
    private Double valorRegistado;
    private String mensagem;
    private String dataHora;

    public AlertaResponseDTO() {}

    public AlertaResponseDTO(Integer idAlerta, String tipoAlerta, Double valorRegistado, String mensagem, String dataHora) {
        this.idAlerta = idAlerta;
        this.tipoAlerta = tipoAlerta;
        this.valorRegistado = valorRegistado;
        this.mensagem = mensagem;
        this.dataHora = dataHora;
    }

    public Integer getIdAlerta() { return idAlerta; }
    public void setIdAlerta(Integer idAlerta) { this.idAlerta = idAlerta; }

    public String getTipoAlerta() { return tipoAlerta; }
    public void setTipoAlerta(String tipoAlerta) { this.tipoAlerta = tipoAlerta; }

    public Double getValorRegistado() { return valorRegistado; }
    public void setValorRegistado(Double valorRegistado) { this.valorRegistado = valorRegistado; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }

    public String getDataHora() { return dataHora; }
    public void setDataHora(String dataHora) { this.dataHora = dataHora; }
}