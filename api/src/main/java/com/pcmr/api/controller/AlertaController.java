package com.pcmr.api.controller;

import com.pcmr.api.dto.AlertaRequestDTO;
import com.pcmr.api.service.AlertaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

    @Autowired
    private AlertaService alertaService;

    @PostMapping
    public ResponseEntity<String> registarAlerta(@RequestBody AlertaRequestDTO alertaDTO) {
        try {
            alertaService.registarAlerta(alertaDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body("Alerta registado com sucesso na Base de Dados.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro ao registar alerta: " + e.getMessage());
        }
    }
}