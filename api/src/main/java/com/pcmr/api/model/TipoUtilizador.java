package com.pcmr.api.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tipo_utilizador")
public class TipoUtilizador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_utilizador")
    private Long idTipoUtilizador;

    @Column(name = "nome", nullable = false, unique = true, length = 50)
    private String nome;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    // Getters e Setters
    public Long getIdTipoUtilizador() { return idTipoUtilizador; }
    public void setIdTipoUtilizador(Long idTipoUtilizador) { this.idTipoUtilizador = idTipoUtilizador; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
}