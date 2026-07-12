package com.pcmr.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilizador_paciente_acesso")
public class UtilizadorPacienteAcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_token")
    private Long idToken;

    @ManyToOne
    @JoinColumn(name = "id_utilizador")
    private Utilizador utilizador;

    @Column(name = "token_acesso")
    private String tokenAcesso;

    @Column(name = "data_inicio")
    private LocalDateTime dataInicio;

    @Column(name = "data_fim")
    private LocalDateTime dataFim;

    // Construtores
    public UtilizadorPacienteAcesso() {}

    // Getters e Setters
    public Long getIdToken() { return idToken; }
    public void setIdToken(Long idToken) { this.idToken = idToken; }

    public Utilizador getUtilizador() { return utilizador; }
    public void setUtilizador(Utilizador utilizador) { this.utilizador = utilizador; }

    public String getTokenAcesso() { return tokenAcesso; }
    public void setTokenAcesso(String tokenAcesso) { this.tokenAcesso = tokenAcesso; }

    public LocalDateTime getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDateTime dataInicio) { this.dataInicio = dataInicio; }

    public LocalDateTime getDataFim() { return dataFim; }
    public void setDataFim(LocalDateTime dataFim) { this.dataFim = dataFim; }
}