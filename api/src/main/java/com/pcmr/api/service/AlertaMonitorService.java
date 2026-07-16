package com.pcmr.api.service;

import com.pcmr.api.dto.AlertaRequestDTO;
import com.pcmr.api.dto.ConfiguracaoSistemaDTO;
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
    private final Map<String, OffsetDateTime> ultimoAlertaTemperaturaAlta = new ConcurrentHashMap<>();
    private final Map<String, OffsetDateTime> ultimoAlertaTemperaturaBaixa = new ConcurrentHashMap<>();
    private final Map<String, OffsetDateTime> ultimoAlertaBpmAlto = new ConcurrentHashMap<>();
    private final Map<String, OffsetDateTime> ultimoAlertaBpmBaixo = new ConcurrentHashMap<>();

    public void avaliarLimites(String deviceId, double temperatura, int bpm) {
        ConfiguracaoSistemaDTO config = configuracaoService.obterAtualPorNome(deviceId);
        if (config == null) return; // sensor não registado/sem config aplicável

        if (temperatura > config.getTemperaturaMaxAlerta()) {
            registarSeNecessario(ultimoAlertaTemperaturaAlta, deviceId, () -> {
                AlertaRequestDTO dto = new AlertaRequestDTO();
                dto.setDeviceId(deviceId);
                dto.setTipoAlerta("TEMPERATURA_ALTA");
                dto.setValorRegistado(temperatura);
                dto.setMensagem(String.format(
                        "Temperatura de %.1f°C excede o limite máximo de %.1f°C",
                        temperatura, config.getTemperaturaMaxAlerta()
                ));
                alertaService.registarAlerta(dto);
                System.out.println("⚠ Alerta gerado: temperatura alta (" + temperatura + "°C)");
            });
        } else if (temperatura < config.getTemperaturaMinAlerta()) {
            registarSeNecessario(ultimoAlertaTemperaturaBaixa, deviceId, () -> {
                AlertaRequestDTO dto = new AlertaRequestDTO();
                dto.setDeviceId(deviceId);
                dto.setTipoAlerta("TEMPERATURA_BAIXA");
                dto.setValorRegistado(temperatura);
                dto.setMensagem(String.format(
                        "Temperatura de %.1f°C está abaixo do limite mínimo de %.1f°C",
                        temperatura, config.getTemperaturaMinAlerta()
                ));
                alertaService.registarAlerta(dto);
                System.out.println("⚠ Alerta gerado: temperatura baixa (" + temperatura + "°C)");
            });
        }

        if (bpm > config.getBpmMaxAlerta()) {
            registarSeNecessario(ultimoAlertaBpmAlto, deviceId, () -> {
                AlertaRequestDTO dto = new AlertaRequestDTO();
                dto.setDeviceId(deviceId);
                dto.setTipoAlerta("BPM_ALTO");
                dto.setValorRegistado((double) bpm);
                dto.setMensagem(String.format(
                        "Frequência cardíaca de %d bpm excede o limite máximo de %d bpm",
                        bpm, config.getBpmMaxAlerta()
                ));
                alertaService.registarAlerta(dto);
                System.out.println("⚠ Alerta gerado: BPM alto (" + bpm + ")");
            });
        } else if (bpm > 0 && bpm < config.getBpmMinAlerta()) {
            registarSeNecessario(ultimoAlertaBpmBaixo, deviceId, () -> {
                AlertaRequestDTO dto = new AlertaRequestDTO();
                dto.setDeviceId(deviceId);
                dto.setTipoAlerta("BPM_BAIXO");
                dto.setValorRegistado((double) bpm);
                dto.setMensagem(String.format(
                        "Frequência cardíaca de %d bpm está abaixo do limite mínimo de %d bpm",
                        bpm, config.getBpmMinAlerta()
                ));
                alertaService.registarAlerta(dto);
                System.out.println("⚠ Alerta gerado: BPM baixo (" + bpm + ")");
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