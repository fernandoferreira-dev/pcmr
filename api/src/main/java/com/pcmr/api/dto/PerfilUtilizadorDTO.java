package com.pcmr.api.dto;

public class PerfilUtilizadorDTO {
    private String username;
    private String nome;
    private String email;
    private String telemovel;
    private String dataNascimento; // formato ISO "yyyy-MM-dd", null se não definida
    private String tipoUtilizador;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelemovel() { return telemovel; }
    public void setTelemovel(String telemovel) { this.telemovel = telemovel; }

    public String getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(String dataNascimento) { this.dataNascimento = dataNascimento; }

    public String getTipoUtilizador() { return tipoUtilizador; }
    public void setTipoUtilizador(String tipoUtilizador) { this.tipoUtilizador = tipoUtilizador; }
}