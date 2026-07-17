package com.pcmr.api.controller;

import com.pcmr.api.dto.ConfiguracaoPresencaDTO;
import com.pcmr.api.service.PresencaConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/presenca/config")
public class PresencaConfigController {

    @Autowired
    private PresencaConfigService presencaConfigService;

    @GetMapping
    public ResponseEntity<ConfiguracaoPresencaDTO> obter(@RequestParam Long idSensor) {
        return ResponseEntity.ok(presencaConfigService.obterAtual(idSensor));
    }

    @PutMapping
    public ResponseEntity<?> atualizar(@RequestBody ConfiguracaoPresencaDTO dto) {
        try {
            return ResponseEntity.ok(presencaConfigService.atualizar(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}