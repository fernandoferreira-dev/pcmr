package com.pcmr.api.dto;

import com.pcmr.api.model.Notification;

import java.time.OffsetDateTime;

public class NotificationDTO {

    private Long id;
    private String titulo;
    private String corpo;
    private String origem;
    private String severidade;
    private OffsetDateTime createdAt;
    private boolean lida;

    public NotificationDTO() {
    }

    public NotificationDTO(Notification n) {
        this.id = n.getIdNotification();
        this.titulo = n.getTitulo();
        this.corpo = n.getCorpo();
        this.origem = n.getOrigem();
        this.severidade = n.getSeveridade() != null ? n.getSeveridade().name() : null;
        this.createdAt = n.getCreatedAt();
        this.lida = n.isLida();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getCorpo() { return corpo; }
    public void setCorpo(String corpo) { this.corpo = corpo; }

    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }

    public String getSeveridade() { return severidade; }
    public void setSeveridade(String severidade) { this.severidade = severidade; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isLida() { return lida; }
    public void setLida(boolean lida) { this.lida = lida; }
}