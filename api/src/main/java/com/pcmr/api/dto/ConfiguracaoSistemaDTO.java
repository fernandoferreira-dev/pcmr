package com.pcmr.api.dto;

public class ConfiguracaoSistemaDTO {
    private Long idSensor;
    private double temperaturaMaxAlerta;
    private double temperaturaMinAlerta;
    private int bpmMaxAlerta;
    private int bpmMinAlerta;
    private String atualizadoEm;
    private Long idUtilizadorAtualizou;

    public Long getIdSensor() { return idSensor; }
    public void setIdSensor(Long idSensor) { this.idSensor = idSensor; }

    public double getTemperaturaMaxAlerta() { return temperaturaMaxAlerta; }
    public void setTemperaturaMaxAlerta(double temperaturaMaxAlerta) { this.temperaturaMaxAlerta = temperaturaMaxAlerta; }

    public double getTemperaturaMinAlerta() { return temperaturaMinAlerta; }
    public void setTemperaturaMinAlerta(double temperaturaMinAlerta) { this.temperaturaMinAlerta = temperaturaMinAlerta; }

    public int getBpmMaxAlerta() { return bpmMaxAlerta; }
    public void setBpmMaxAlerta(int bpmMaxAlerta) { this.bpmMaxAlerta = bpmMaxAlerta; }

    public int getBpmMinAlerta() { return bpmMinAlerta; }
    public void setBpmMinAlerta(int bpmMinAlerta) { this.bpmMinAlerta = bpmMinAlerta; }

    public String getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(String atualizadoEm) { this.atualizadoEm = atualizadoEm; }

    public Long getIdUtilizadorAtualizou() { return idUtilizadorAtualizou; }
    public void setIdUtilizadorAtualizou(Long idUtilizadorAtualizou) { this.idUtilizadorAtualizou = idUtilizadorAtualizou; }
}