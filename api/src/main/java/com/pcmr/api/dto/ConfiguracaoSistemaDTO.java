package com.pcmr.api.dto;

public class ConfiguracaoSistemaDTO {
    private double temperaturaMaxAlerta;
    private int bpmMaxAlerta;
    private String atualizadoEm;
    private Long idUtilizadorAtualizou;

    public double getTemperaturaMaxAlerta() { return temperaturaMaxAlerta; }
    public void setTemperaturaMaxAlerta(double temperaturaMaxAlerta) { this.temperaturaMaxAlerta = temperaturaMaxAlerta; }

    public int getBpmMaxAlerta() { return bpmMaxAlerta; }
    public void setBpmMaxAlerta(int bpmMaxAlerta) { this.bpmMaxAlerta = bpmMaxAlerta; }

    public String getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(String atualizadoEm) { this.atualizadoEm = atualizadoEm; }

    public Long getIdUtilizadorAtualizou() { return idUtilizadorAtualizou; }
    public void setIdUtilizadorAtualizou(Long idUtilizadorAtualizou) { this.idUtilizadorAtualizou = idUtilizadorAtualizou; }
}