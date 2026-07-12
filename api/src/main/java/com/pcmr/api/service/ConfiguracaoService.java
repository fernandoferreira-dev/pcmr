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
        ConfiguracaoSistema nova = new ConfiguracaoSistema();
        nova.setTemperaturaMaxAlerta(BigDecimal.valueOf(dto.getTemperaturaMaxAlerta()));
        nova.setBpmMaxAlerta(dto.getBpmMaxAlerta());
        nova.setAtualizadoEm(OffsetDateTime.now());
        nova.setIdUtilizadorAtualizou(dto.getIdUtilizadorAtualizou());

        ConfiguracaoSistema guardada = repository.save(nova);
        cache = paraDTO(guardada);
        return cache;
    }

    private ConfiguracaoSistema criarPadrao() {
        ConfiguracaoSistema c = new ConfiguracaoSistema();
        c.setTemperaturaMaxAlerta(BigDecimal.valueOf(37.8));
        c.setBpmMaxAlerta(110);
        c.setAtualizadoEm(OffsetDateTime.now());
        return repository.save(c);
    }

    private ConfiguracaoSistemaDTO paraDTO(ConfiguracaoSistema c) {
        ConfiguracaoSistemaDTO dto = new ConfiguracaoSistemaDTO();
        dto.setTemperaturaMaxAlerta(c.getTemperaturaMaxAlerta().doubleValue());
        dto.setBpmMaxAlerta(c.getBpmMaxAlerta());
        dto.setAtualizadoEm(c.getAtualizadoEm().toString());
        dto.setIdUtilizadorAtualizou(c.getIdUtilizadorAtualizou());
        return dto;
    }
}