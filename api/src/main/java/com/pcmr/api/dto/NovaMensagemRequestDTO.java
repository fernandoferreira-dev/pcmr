package com.pcmr.api.dto;

public class NovaMensagemRequestDTO {
    private Long idRemetente;
    private Long idDestinatario;
    private String assunto;
    private String corpo;

    public Long getIdRemetente() { return idRemetente; }
    public void setIdRemetente(Long idRemetente) { this.idRemetente = idRemetente; }

    public Long getIdDestinatario() { return idDestinatario; }
    public void setIdDestinatario(Long idDestinatario) { this.idDestinatario = idDestinatario; }

    public String getAssunto() { return assunto; }
    public void setAssunto(String assunto) { this.assunto = assunto; }

    public String getCorpo() { return corpo; }
    public void setCorpo(String corpo) { this.corpo = corpo; }
}