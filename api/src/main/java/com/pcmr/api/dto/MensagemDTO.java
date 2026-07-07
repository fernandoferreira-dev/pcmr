package com.pcmr.api.dto;

public class MensagemDTO {
    private Long idMensagem;
    private Long idRemetente;
    private String nomeRemetente;
    private String emailRemetente;
    private String assunto;
    private String corpo;
    private String dataEnvio; 
    private boolean lida;

    public Long getIdMensagem() { return idMensagem; }
    public void setIdMensagem(Long idMensagem) { this.idMensagem = idMensagem; }

    public Long getIdRemetente() { return idRemetente; }
    public void setIdRemetente(Long idRemetente) { this.idRemetente = idRemetente; }

    public String getNomeRemetente() { return nomeRemetente; }
    public void setNomeRemetente(String nomeRemetente) { this.nomeRemetente = nomeRemetente; }

    public String getEmailRemetente() { return emailRemetente; }
    public void setEmailRemetente(String emailRemetente) { this.emailRemetente = emailRemetente; }

    public String getAssunto() { return assunto; }
    public void setAssunto(String assunto) { this.assunto = assunto; }

    public String getCorpo() { return corpo; }
    public void setCorpo(String corpo) { this.corpo = corpo; }

    public String getDataEnvio() { return dataEnvio; }
    public void setDataEnvio(String dataEnvio) { this.dataEnvio = dataEnvio; }

    public boolean isLida() { return lida; }
    public void setLida(boolean lida) { this.lida = lida; }
}