package com.pcmr.api.dto;

public class EstadoAlertaDTO {

    private String estado;   // Temperatura: NORMAL | BAIXA | ALTA — Bpm: NORMAL | BAIXO | ALTO
    private String mensagem; // null quando estado == NORMAL
    private double limiteMin;
    private double limiteMax;

    public EstadoAlertaDTO() {}

    public EstadoAlertaDTO(String estado, String mensagem, double limiteMin, double limiteMax) {
        this.estado = estado;
        this.mensagem = mensagem;
        this.limiteMin = limiteMin;
        this.limiteMax = limiteMax;
    }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }

    public double getLimiteMin() { return limiteMin; }
    public void setLimiteMin(double limiteMin) { this.limiteMin = limiteMin; }

    public double getLimiteMax() { return limiteMax; }
    public void setLimiteMax(double limiteMax) { this.limiteMax = limiteMax; }
}