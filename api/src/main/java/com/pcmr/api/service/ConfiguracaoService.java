package com.pcmr.api.service;

import com.pcmr.api.dto.ConfiguracaoSistemaDTO;
import com.pcmr.api.model.ConfiguracaoSistema;
import com.pcmr.api.model.Sensor;
import com.pcmr.api.mqtt.MqttPublisherService;
import com.pcmr.api.repository.ConfiguracaoSistemaRepository;
import com.pcmr.api.repository.SensorRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConfiguracaoService {

    @Autowired
    private ConfiguracaoSistemaRepository repository;

    private volatile ConfiguracaoSistemaDTO cache;

    @Autowired
    private MqttPublisherService mqttPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<Long, ConfiguracaoSistemaDTO> cachePorSensor = new ConcurrentHashMap<>();

    public ConfiguracaoSistemaDTO obterAtual(Long idSensor) {
        ConfiguracaoSistemaDTO cache = cachePorSensor.get(idSensor);
        if (cache != null) return cache;

        ConfiguracaoSistema atual = repository.findTopByOrderByAtualizadoEmDesc()
                .orElseGet(this::criarPadrao);

        cache = paraDTO(atual);
        return cache;
    }

    public ConfiguracaoSistemaDTO obterAtualPorNome(String nomeSensor) {
        return sensorRepository.findByNome(nomeSensor)
                .map(s -> obterAtual(s.getIdSensor()))
                .orElse(null);
    }

    public ConfiguracaoSistemaDTO atualizar(ConfiguracaoSistemaDTO dto) {
        if (dto.getIdSensor() == null) {
            throw new IllegalArgumentException("idSensor é obrigatório");
        }
        if (dto.getTemperaturaMinAlerta() >= dto.getTemperaturaMaxAlerta()) {
            throw new IllegalArgumentException("A temperatura mínima deve ser inferior à máxima");
        }
        if (dto.getBpmMinAlerta() >= dto.getBpmMaxAlerta()) {
            throw new IllegalArgumentException("O BPM mínimo deve ser inferior ao máximo");
        }

        ConfiguracaoSistema nova = new ConfiguracaoSistema();
        nova.setTemperaturaMaxAlerta(BigDecimal.valueOf(dto.getTemperaturaMaxAlerta()));
        nova.setTemperaturaMinAlerta(BigDecimal.valueOf(dto.getTemperaturaMinAlerta()));
        nova.setBpmMaxAlerta(dto.getBpmMaxAlerta());
        nova.setBpmMinAlerta(dto.getBpmMinAlerta());
        nova.setAtualizadoEm(OffsetDateTime.now());
        nova.setIdUtilizadorAtualizou(dto.getIdUtilizadorAtualizou());

        ConfiguracaoSistema guardada = repository.save(nova);
        ConfiguracaoSistemaDTO resultado = paraDTO(guardada);
        cachePorSensor.put(dto.getIdSensor(), resultado);

        if ("WEARABLE".equals(sensor.getTipoMetrica())) {
            publicarLimiteTemperatura(sensor.getNome(), dto.getTemperaturaMaxAlerta());
        }

        return resultado;
    }

    private void publicarLimiteTemperatura(String nomeSensor, double temperaturaMax) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("temperaturaMaxAlerta", temperaturaMax);

            String json = objectMapper.writeValueAsString(payload);
            mqttPublisher.publishRetido("sensors/" + nomeSensor + "/limite-temperatura", json);
        } catch (Exception e) {
            System.err.println("✗ Erro ao publicar limite de temperatura: " + e.getMessage());
        }
    }

    private ConfiguracaoSistema criarPadrao(Long idSensor) {
        Sensor sensor = sensorRepository.findById(idSensor)
                .orElseThrow(() -> new IllegalArgumentException("Sensor não encontrado"));

        ConfiguracaoSistema c = new ConfiguracaoSistema();
        c.setTemperaturaMaxAlerta(BigDecimal.valueOf(37.8));
        c.setTemperaturaMinAlerta(BigDecimal.valueOf(35.0));
        c.setBpmMaxAlerta(110);
        c.setBpmMinAlerta(50);
        c.setAtualizadoEm(OffsetDateTime.now());

        ConfiguracaoSistema guardada = repository.save(c);

        if ("WEARABLE".equals(sensor.getTipoMetrica())) {
            publicarLimiteTemperatura(sensor.getNome(), 37.8);
        }

        return guardada;
    }

    private ConfiguracaoSistemaDTO paraDTO(ConfiguracaoSistema c) {
        ConfiguracaoSistemaDTO dto = new ConfiguracaoSistemaDTO();
        dto.setTemperaturaMaxAlerta(c.getTemperaturaMaxAlerta().doubleValue());
        dto.setTemperaturaMinAlerta(c.getTemperaturaMinAlerta().doubleValue());
        dto.setBpmMaxAlerta(c.getBpmMaxAlerta());
        dto.setBpmMinAlerta(c.getBpmMinAlerta());
        dto.setAtualizadoEm(c.getAtualizadoEm().toString());
        dto.setIdUtilizadorAtualizou(c.getIdUtilizadorAtualizou());
        return dto;
    }
}