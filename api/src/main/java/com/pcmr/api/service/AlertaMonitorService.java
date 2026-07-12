package com.pcmr.api.service;

import com.pcmr.api.dto.AlertaRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AlertaMonitorService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private AlertaService alertaService;

    private static final long COOLDOWN_SEGUNDOS = 60;
    private final Map<String, OffsetDateTime> ultimoAlertaTemperatura = new ConcurrentHashMap<>();
    private final Map<String, OffsetDateTime> ultimoAlertaBpm = new ConcurrentHashMap<>();

    public void avaliarLimites(String deviceId, double temperatura, int bpm) {
        var config = configuracaoService.obterAtual();

        if (temperatura > config.getTemperaturaMaxAlerta()) {
            registarSeNecessario(ultimoAlertaTemperatura, deviceId, () -> {
                AlertaRequestDTO dto = new AlertaRequestDTO();
                dto.setDeviceId(deviceId);
                dto.setTipoAlerta("TEMPERATURA_ALTA");
                dto.setValorRegistado(temperatura);
                dto.setMensagem(String.format(
                        "Temperatura de %.1f°C excede o limite de %.1f°C",
                        temperatura, config.getTemperaturaMaxAlerta()
                ));
                alertaService.registarAlerta(dto);
                System.out.println("⚠ Alerta gerado: temperatura alta (" + temperatura + "°C)");
            });
        }

        if (bpm > config.getBpmMaxAlerta()) {
            registarSeNecessario(ultimoAlertaBpm, deviceId, () -> {
                AlertaRequestDTO dto = new AlertaRequestDTO();
                dto.setDeviceId(deviceId);
                dto.setTipoAlerta("BPM_ALTO");
                dto.setValorRegistado((double) bpm);
                dto.setMensagem(String.format(
                        "Frequência cardíaca de %d bpm excede o limite de %d bpm",
                        bpm, config.getBpmMaxAlerta()
                ));
                alertaService.registarAlerta(dto);
                System.out.println("⚠ Alerta gerado: BPM alto (" + bpm + ")");
            });
        }
    }

    private void registarSeNecessario(Map<String, OffsetDateTime> mapa, String deviceId, Runnable acao) {
        OffsetDateTime agora = OffsetDateTime.now();
        OffsetDateTime ultimo = mapa.get(deviceId);

        if (ultimo == null || Duration.between(ultimo, agora).getSeconds() >= COOLDOWN_SEGUNDOS) {
            mapa.put(deviceId, agora);
            acao.run();
        }
    }
}