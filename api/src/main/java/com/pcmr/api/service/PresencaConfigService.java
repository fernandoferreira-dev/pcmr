package com.pcmr.api.service;

import com.pcmr.api.dto.ConfiguracaoPresencaDTO;
import com.pcmr.api.model.ConfiguracaoPresenca;
import com.pcmr.api.model.Sensor;
import com.pcmr.api.mqtt.MqttPublisherService;
import com.pcmr.api.repository.ConfiguracaoPresencaRepository;
import com.pcmr.api.repository.SensorRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PresencaConfigService {

    @Autowired
    private ConfiguracaoPresencaRepository repository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private MqttPublisherService mqttPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ConfiguracaoPresencaDTO obterAtual(Long idSensor) {
        ConfiguracaoPresenca atual = repository.findTopBySensor_IdSensorOrderByAtualizadoEmDesc(idSensor)
                .orElseGet(() -> criarPadrao(idSensor));
        return paraDTO(atual);
    }

    public ConfiguracaoPresencaDTO atualizar(ConfiguracaoPresencaDTO dto) {
        if (dto.getIdSensor() == null) {
            throw new IllegalArgumentException("idSensor é obrigatório");
        }
        if (dto.getDistanciaDeteccaoCm() <= 0) {
            throw new IllegalArgumentException("A distância de deteção deve ser positiva");
        }
        if (dto.getTempoConfirmacaoSegundos() <= 0) {
            throw new IllegalArgumentException("O tempo de confirmação deve ser positivo");
        }

        Sensor sensor = sensorRepository.findById(dto.getIdSensor())
                .orElseThrow(() -> new IllegalArgumentException("Sensor não encontrado"));

        ConfiguracaoPresenca nova = new ConfiguracaoPresenca();
        nova.setSensor(sensor);
        nova.setDistanciaDeteccaoCm(BigDecimal.valueOf(dto.getDistanciaDeteccaoCm()));
        nova.setTempoConfirmacaoSegundos(dto.getTempoConfirmacaoSegundos());
        nova.setAtualizadoEm(OffsetDateTime.now());
        nova.setIdUtilizadorAtualizou(dto.getIdUtilizadorAtualizou());

        ConfiguracaoPresenca guardada = repository.save(nova);

        publicarConfigParaSensor(sensor.getNome(), dto);

        return paraDTO(guardada);
    }
    
    private void publicarConfigParaSensor(String nomeSensor, ConfiguracaoPresencaDTO dto) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("distanciaCm", dto.getDistanciaDeteccaoCm());
            payload.put("tempoConfirmacaoSegundos", dto.getTempoConfirmacaoSegundos());

            String json = objectMapper.writeValueAsString(payload);
            mqttPublisher.publishRetido("sensors/" + nomeSensor + "/config", json);
        } catch (Exception e) {
            System.err.println("✗ Erro ao publicar configuração de presença: " + e.getMessage());
        }
    }

    private ConfiguracaoPresenca criarPadrao(Long idSensor) {
        Sensor sensor = sensorRepository.findById(idSensor)
                .orElseThrow(() -> new IllegalArgumentException("Sensor não encontrado"));

        ConfiguracaoPresenca c = new ConfiguracaoPresenca();
        c.setSensor(sensor);
        c.setDistanciaDeteccaoCm(BigDecimal.valueOf(50.0));
        c.setTempoConfirmacaoSegundos(5);
        c.setAtualizadoEm(OffsetDateTime.now());
        return repository.save(c);
    }

    private ConfiguracaoPresencaDTO paraDTO(ConfiguracaoPresenca c) {
        ConfiguracaoPresencaDTO dto = new ConfiguracaoPresencaDTO();
        dto.setIdSensor(c.getSensor().getIdSensor());
        dto.setDistanciaDeteccaoCm(c.getDistanciaDeteccaoCm().doubleValue());
        dto.setTempoConfirmacaoSegundos(c.getTempoConfirmacaoSegundos());
        dto.setAtualizadoEm(c.getAtualizadoEm().toString());
        dto.setIdUtilizadorAtualizou(c.getIdUtilizadorAtualizou());
        return dto;
    }
}