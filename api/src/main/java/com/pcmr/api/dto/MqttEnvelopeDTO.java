package com.pcmr.api.dto;

public class MqttEnvelopeDTO {
    
    private String iv;
    private String data;
    private long crc;

    // Construtor vazio necessário para o Jackson (desserialização JSON)
    public MqttEnvelopeDTO() {
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public long getCrc() {
        return crc;
    }

    public void setCrc(long crc) {
        this.crc = crc;
    }
}