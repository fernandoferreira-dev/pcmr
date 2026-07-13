package com.pcmr.api.controller;

import com.pcmr.api.dto.ConfiguracaoSistemaDTO;
import com.pcmr.api.service.ConfiguracaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    @Autowired
    private ConfiguracaoService configuracaoService;

    @GetMapping
    public ResponseEntity<ConfiguracaoSistemaDTO> obter() {
        return ResponseEntity.ok(configuracaoService.obterAtual());
    }

    @PutMapping
    public ResponseEntity<?> atualizar(@RequestBody ConfiguracaoSistemaDTO dto) {
        try {
            return ResponseEntity.ok(configuracaoService.atualizar(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}