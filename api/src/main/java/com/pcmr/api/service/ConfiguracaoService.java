package com.pcmr.api.service;

import com.pcmr.api.dto.ConfiguracaoSistemaDTO;
import com.pcmr.api.model.ConfiguracaoSistema;
import com.pcmr.api.repository.ConfiguracaoSistemaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Service
public class ConfiguracaoService {

    @Autowired
    private ConfiguracaoSistemaRepository repository;

    private volatile ConfiguracaoSistemaDTO cache;

    public synchronized ConfiguracaoSistemaDTO obterAtual() {
        if (cache != null) return cache;

        ConfiguracaoSistema atual = repository.findTopByOrderByAtualizadoEmDesc()
                .orElseGet(this::criarPadrao);

        cache = paraDTO(atual);
        return cache;
    }

    public synchronized ConfiguracaoSistemaDTO atualizar(ConfiguracaoSistemaDTO dto) {
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
        cache = paraDTO(guardada);
        return cache;
    }

    private ConfiguracaoSistema criarPadrao() {
        ConfiguracaoSistema c = new ConfiguracaoSistema();
        c.setTemperaturaMaxAlerta(BigDecimal.valueOf(37.8));
        c.setTemperaturaMinAlerta(BigDecimal.valueOf(35.0));
        c.setBpmMaxAlerta(110);
        c.setBpmMinAlerta(50);
        c.setAtualizadoEm(OffsetDateTime.now());
        return repository.save(c);
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