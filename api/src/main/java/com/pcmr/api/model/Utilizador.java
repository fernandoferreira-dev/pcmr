package com.pcmr.api.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "utilizador")
public class Utilizador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_utilizador")
    private Long idUtilizador;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao = OffsetDateTime.now();

    @Column(name = "data_ultima_atualizacao", nullable = false)
    private OffsetDateTime dataUltimaAtualizacao = OffsetDateTime.now();

    @ManyToOne
    @JoinColumn(name = "id_tipo_utilizador", nullable = false)
    private TipoUtilizador tipoUtilizador;

    @ManyToOne
    @JoinColumn(name = "id_pessoa", nullable = false)
    private Pessoa pessoa;

    public Long getIdUtilizador() { return idUtilizador; }
    public void setIdUtilizador(Long idUtilizador) { this.idUtilizador = idUtilizador; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public OffsetDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(OffsetDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public OffsetDateTime getDataUltimaAtualizacao() { return dataUltimaAtualizacao; }
    public void setDataUltimaAtualizacao(OffsetDateTime dataUltimaAtualizacao) { this.dataUltimaAtualizacao = dataUltimaAtualizacao; }

    public TipoUtilizador getTipoUtilizador() { return tipoUtilizador; }
    public void setTipoUtilizador(TipoUtilizador tipoUtilizador) { this.tipoUtilizador = tipoUtilizador; }

    public Pessoa getPessoa() { return pessoa; }
    public void setPessoa(Pessoa pessoa) { this.pessoa = pessoa; }
}