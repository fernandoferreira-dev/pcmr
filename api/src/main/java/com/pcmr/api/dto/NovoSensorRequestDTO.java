package com.pcmr.api.dto;

public class NovoSensorRequestDTO {
    private String nome;
    private String nomeExibicao;
    private String localizacao;
    private String tipoMetrica;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getNomeExibicao() { return nomeExibicao; }
    public void setNomeExibicao(String nomeExibicao) { this.nomeExibicao = nomeExibicao; }

    public String getLocalizacao() { return localizacao; }
    public void setLocalizacao(String localizacao) { this.localizacao = localizacao; }

    public String getTipoMetrica() { return tipoMetrica; }
    public void setTipoMetrica(String tipoMetrica) { this.tipoMetrica = tipoMetrica; }
}