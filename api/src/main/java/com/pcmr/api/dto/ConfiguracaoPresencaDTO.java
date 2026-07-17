package com.pcmr.api.dto;

public class ConfiguracaoPresencaDTO {
    private Long idSensor;
    private double distanciaDeteccaoCm;
    private int tempoConfirmacaoSegundos;
    private String atualizadoEm;
    private Long idUtilizadorAtualizou;

    public Long getIdSensor() { return idSensor; }
    public void setIdSensor(Long idSensor) { this.idSensor = idSensor; }

    public double getDistanciaDeteccaoCm() { return distanciaDeteccaoCm; }
    public void setDistanciaDeteccaoCm(double distanciaDeteccaoCm) { this.distanciaDeteccaoCm = distanciaDeteccaoCm; }

    public int getTempoConfirmacaoSegundos() { return tempoConfirmacaoSegundos; }
    public void setTempoConfirmacaoSegundos(int tempoConfirmacaoSegundos) { this.tempoConfirmacaoSegundos = tempoConfirmacaoSegundos; }

    public String getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(String atualizadoEm) { this.atualizadoEm = atualizadoEm; }

    public Long getIdUtilizadorAtualizou() { return idUtilizadorAtualizou; }
    public void setIdUtilizadorAtualizou(Long idUtilizadorAtualizou) { this.idUtilizadorAtualizou = idUtilizadorAtualizou; }
}