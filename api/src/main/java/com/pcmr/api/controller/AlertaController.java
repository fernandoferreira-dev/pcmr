package com.pcmr.api.controller;

import com.pcmr.api.dto.AlertaRequestDTO;
import com.pcmr.api.dto.AlertaResponseDTO;
import com.pcmr.api.service.AlertaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<AlertaResponseDTO>> listar(
            @RequestParam String deviceId,
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde
    ) {
        LocalDateTime dataInicio = (desde != null) 
                ? desde 
                : LocalDateTime.now().minusHours(24);

        return ResponseEntity.ok(alertaService.listarPorDispositivo(deviceId, dataInicio));
    }

    /**
     * NEW: Endpoint called by frontend
     */
    @GetMapping("/recentes")
    public ResponseEntity<List<AlertaResponseDTO>> getAlertasRecentes(
            @RequestParam(defaultValue = "10") int limite) {
        
        // TODO: Implement this method in AlertaService if it doesn't exist yet
        return ResponseEntity.ok(alertaService.listarRecentes(limite));
    }
}