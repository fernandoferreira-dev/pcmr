package com.pcmr.api.controller;

import com.pcmr.api.dto.PresencaDTO;
import com.pcmr.api.service.PresencaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/presenca")
public class PresencaController {

    @Autowired
    private PresencaService presencaService;

    @GetMapping("/estado")
    public ResponseEntity<PresencaDTO> estado() {
        var estado = presencaService.getEstadoAtual();
        return ResponseEntity.ok(new PresencaDTO(estado.presente, estado.atualizadoEm.toString()));
    }
}