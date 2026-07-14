package com.pcmr.api.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "mensagem")
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mensagem")
    private Long idMensagem;

    @ManyToOne
    @JoinColumn(name = "id_utilizador_remetente", nullable = false)
    private Utilizador remetente;

    @ManyToOne
    @JoinColumn(name = "id_utilizador_destinatario", nullable = false)
    private Utilizador destinatario;

    @Column(name = "assunto", nullable = false)
    private String assunto;

    @Column(name = "corpo")
    private String corpo;

    @Column(name = "data_envio", nullable = false)
    private OffsetDateTime dataEnvio = OffsetDateTime.now();

    @Column(name = "lida", nullable = false)
    private boolean lida = false;

    @Column(name = "guardada", nullable = false)
    private boolean guardada = false;

    public boolean isGuardada() { return guardada; }
    public void setGuardada(boolean guardada) { this.guardada = guardada; }

    public Long getIdMensagem() { return idMensagem; }
    public void setIdMensagem(Long idMensagem) { this.idMensagem = idMensagem; }

    public Utilizador getRemetente() { return remetente; }
    public void setRemetente(Utilizador remetente) { this.remetente = remetente; }

    public Utilizador getDestinatario() { return destinatario; }
    public void setDestinatario(Utilizador destinatario) { this.destinatario = destinatario; }

    public String getAssunto() { return assunto; }
    public void setAssunto(String assunto) { this.assunto = assunto; }

    public String getCorpo() { return corpo; }
    public void setCorpo(String corpo) { this.corpo = corpo; }

    public OffsetDateTime getDataEnvio() { return dataEnvio; }
    public void setDataEnvio(OffsetDateTime dataEnvio) { this.dataEnvio = dataEnvio; }

    public boolean isLida() { return lida; }
    public void setLida(boolean lida) { this.lida = lida; }
}