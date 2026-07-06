package com.pcmr.api.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import com.pcmr.api.model.Diagnostico;
import com.pcmr.api.repository.DiagnosticoRepository;
import com.pcmr.api.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/diagnosticos")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class DiagnosticoController {

    @Autowired
    private DiagnosticoRepository diagnosticoRepository;

    @Autowired
    private PessoaRepository pessoaRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardData() {
        // Conta o número total de registos
        long totalPacientes = pessoaRepository.count();
        long totalDiagnosticos = diagnosticoRepository.count();

        // Vai buscar todos os diagnósticos e mapeia para um formato amigável para o frontend
        List<Map<String, Object>> diagnosticosList = diagnosticoRepository.findAll().stream().map(d -> {
            return Map.<String, Object>of(
                "id", d.getIdDiagnostico(),
                "patient", d.getConsulta().getPaciente().getNome(),
                "date", d.getGdhDiagnostico().toString(),
                "status", d.getRelacaoCausaEfeito() != null ? d.getRelacaoCausaEfeito() : "Sem Observações"
            );
        }).collect(Collectors.toList());

        // Devolve tudo num único objeto JSON
        return ResponseEntity.ok(Map.of(
            "totalPacientes", totalPacientes,
            "totalDiagnosticos", totalDiagnosticos,
            "diagnosticos", diagnosticosList
        ));
    }
}