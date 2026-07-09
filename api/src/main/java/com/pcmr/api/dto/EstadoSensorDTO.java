package com.pcmr.api.dto;

public class EstadoSensorDTO {
    private String deviceId;
    private boolean online;
    private String ultimaLeitura; // ISO string, null se nunca houve leitura
    private long segundosDesdeUltimaLeitura; // -1 se nunca houve leitura

    public EstadoSensorDTO() {}

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }

    public String getUltimaLeitura() { return ultimaLeitura; }
    public void setUltimaLeitura(String ultimaLeitura) { this.ultimaLeitura = ultimaLeitura; }

    public long getSegundosDesdeUltimaLeitura() { return segundosDesdeUltimaLeitura; }
    public void setSegundosDesdeUltimaLeitura(long segundosDesdeUltimaLeitura) { this.segundosDesdeUltimaLeitura = segundosDesdeUltimaLeitura; }
}