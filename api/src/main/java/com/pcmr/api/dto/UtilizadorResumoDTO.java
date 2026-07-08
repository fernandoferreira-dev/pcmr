package com.pcmr.api.dto;

public class UtilizadorResumoDTO {
    private Long idUtilizador;
    private String nome;
    private String email;
    private String tipoUtilizador;

    public UtilizadorResumoDTO() {}

    public UtilizadorResumoDTO(Long idUtilizador, String nome, String email, String tipoUtilizador) {
        this.idUtilizador = idUtilizador;
        this.nome = nome;
        this.email = email;
        this.tipoUtilizador = tipoUtilizador;
    }

    public Long getIdUtilizador() { return idUtilizador; }
    public void setIdUtilizador(Long idUtilizador) { this.idUtilizador = idUtilizador; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTipoUtilizador() { return tipoUtilizador; }
    public void setTipoUtilizador(String tipoUtilizador) { this.tipoUtilizador = tipoUtilizador; }
}