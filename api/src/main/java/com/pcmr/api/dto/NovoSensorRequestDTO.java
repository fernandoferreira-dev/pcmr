package com.pcmr.api.dto;

public class NovoSensorRequestDTO {
    private String nome;
    private String localizacao;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getLocalizacao() { return localizacao; }
    public void setLocalizacao(String localizacao) { this.localizacao = localizacao; }
}