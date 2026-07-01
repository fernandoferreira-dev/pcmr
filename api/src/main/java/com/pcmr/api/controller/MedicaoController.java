package com.pcmr.api.controller;

import com.pcmr.api.model.Medicao;
import com.pcmr.api.repository.MedicaoRepository;
import com.pcmr.api.service.MedicaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/medicoes")
public class MedicaoController {

    @Autowired
    private MedicaoService medicaoService;

    @Autowired
    private MedicaoRepository medicaoRepository;

    public static class IniciarMedicaoRequest {
        public Long pacienteId;
        public String deviceId;
    }

    @PostMapping("/iniciar")
    public ResponseEntity<?> iniciar(@RequestBody IniciarMedicaoRequest request) {
        if (request.pacienteId == null || request.deviceId == null || request.deviceId.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("pacienteId e deviceId são obrigatórios");
        }
        try {
            Medicao medicao = medicaoService.iniciarMedicao(request.pacienteId, request.deviceId);
            return ResponseEntity.ok(medicao);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obter(@PathVariable Long id) {
        return medicaoRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/paciente/{pacienteId}/ultima")
    public ResponseEntity<?> ultima(@PathVariable Long pacienteId) {
        return medicaoRepository.findFirstByPacienteIdOrderByIniciadoEmDesc(pacienteId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}