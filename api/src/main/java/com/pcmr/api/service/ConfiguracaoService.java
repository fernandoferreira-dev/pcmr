package com.pcmr.api.service;

import com.pcmr.api.dto.ConfiguracaoSistemaDTO;
import com.pcmr.api.model.ConfiguracaoSistema;
import com.pcmr.api.model.Sensor;
import com.pcmr.api.repository.ConfiguracaoSistemaRepository;
import com.pcmr.api.repository.SensorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConfiguracaoService {

    @Autowired
    private ConfiguracaoSistemaRepository repository;

    @Autowired
    private SensorRepository sensorRepository;

    private final Map<Long, ConfiguracaoSistemaDTO> cachePorSensor = new ConcurrentHashMap<>();

    public ConfiguracaoSistemaDTO obterAtual(Long idSensor) {
        ConfiguracaoSistemaDTO cache = cachePorSensor.get(idSensor);
        if (cache != null) return cache;

        ConfiguracaoSistema atual = repository.findTopBySensor_IdSensorOrderByAtualizadoEmDesc(idSensor)
                .orElseGet(() -> criarPadrao(idSensor));

        ConfiguracaoSistemaDTO dto = paraDTO(atual);
        cachePorSensor.put(idSensor, dto);
        return dto;
    }

    // Usado pelo AlertaMonitorService, que só tem o nome (deviceId) do sensor.
    // Devolve null se não houver sensor com esse nome
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

        Sensor sensor = sensorRepository.findById(dto.getIdSensor())
                .orElseThrow(() -> new IllegalArgumentException("Sensor não encontrado"));

        ConfiguracaoSistema nova = new ConfiguracaoSistema();
        nova.setSensor(sensor);
        nova.setTemperaturaMaxAlerta(BigDecimal.valueOf(dto.getTemperaturaMaxAlerta()));
        nova.setTemperaturaMinAlerta(BigDecimal.valueOf(dto.getTemperaturaMinAlerta()));
        nova.setBpmMaxAlerta(dto.getBpmMaxAlerta());
        nova.setBpmMinAlerta(dto.getBpmMinAlerta());
        nova.setAtualizadoEm(OffsetDateTime.now());
        nova.setIdUtilizadorAtualizou(dto.getIdUtilizadorAtualizou());

        ConfiguracaoSistema guardada = repository.save(nova);
        ConfiguracaoSistemaDTO resultado = paraDTO(guardada);
        cachePorSensor.put(dto.getIdSensor(), resultado);
        return resultado;
    }

    private ConfiguracaoSistema criarPadrao(Long idSensor) {
        Sensor sensor = sensorRepository.findById(idSensor)
                .orElseThrow(() -> new IllegalArgumentException("Sensor não encontrado"));

        ConfiguracaoSistema c = new ConfiguracaoSistema();
        c.setSensor(sensor);
        c.setTemperaturaMaxAlerta(BigDecimal.valueOf(37.8));
        c.setTemperaturaMinAlerta(BigDecimal.valueOf(35.0));
        c.setBpmMaxAlerta(110);
        c.setBpmMinAlerta(50);
        c.setAtualizadoEm(OffsetDateTime.now());
        return repository.save(c);
    }

    private ConfiguracaoSistemaDTO paraDTO(ConfiguracaoSistema c) {
        ConfiguracaoSistemaDTO dto = new ConfiguracaoSistemaDTO();
        dto.setIdSensor(c.getSensor().getIdSensor());
        dto.setTemperaturaMaxAlerta(c.getTemperaturaMaxAlerta().doubleValue());
        dto.setTemperaturaMinAlerta(c.getTemperaturaMinAlerta().doubleValue());
        dto.setBpmMaxAlerta(c.getBpmMaxAlerta());
        dto.setBpmMinAlerta(c.getBpmMinAlerta());
        dto.setAtualizadoEm(c.getAtualizadoEm().toString());
        dto.setIdUtilizadorAtualizou(c.getIdUtilizadorAtualizou());
        return dto;
    }
}