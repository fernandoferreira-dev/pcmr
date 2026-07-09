package com.pcmr.api.dto;

public class PresencaDTO {
    private boolean presente;
    private String atualizadoEm;

    public PresencaDTO(boolean presente, String atualizadoEm) {
        this.presente = presente;
        this.atualizadoEm = atualizadoEm;
    }

    public boolean isPresente() { return presente; }
    public void setPresente(boolean presente) { this.presente = presente; }

    public String getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(String atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}