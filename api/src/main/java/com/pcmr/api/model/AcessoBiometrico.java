package com.pcmr.api.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "acesso_biometrico")
public class AcessoBiometrico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_acesso_biometrico")
    private Long idAcessoBiometrico;

    @ManyToOne
    @JoinColumn(name = "id_utilizador", nullable = false)
    private Utilizador utilizador;

    @Column(name = "imp_acesso")
    private String impAcesso;

    @Column(name = "data_registo", nullable = false)
    private OffsetDateTime dataRegisto = OffsetDateTime.now();

    // Getters e Setters
    public Long getIdAcessoBiometrico() { return idAcessoBiometrico; }
    public void setIdAcessoBiometrico(Long idAcessoBiometrico) { this.idAcessoBiometrico = idAcessoBiometrico; }

    public Utilizador getUtilizador() { return utilizador; }
    public void setUtilizador(Utilizador utilizador) { this.utilizador = utilizador; }

    public String getImpAcesso() { return impAcesso; }
    public void setImpAcesso(String impAcesso) { this.impAcesso = impAcesso; }

    public OffsetDateTime getDataRegisto() { return dataRegisto; }
    public void setDataRegisto(OffsetDateTime dataRegisto) { this.dataRegisto = dataRegisto; }
}