package com.pcmr.api.controller;

import com.pcmr.api.dto.DiagnosticoResponseDTO;
import com.pcmr.api.model.Diagnostico;
import com.pcmr.api.repository.DiagnosticoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/diagnosticos")
@CrossOrigin(origins = "*")
public class DiagnosticoController {

    @Autowired
    private DiagnosticoRepository diagnosticoRepository;

    @GetMapping
    public List<DiagnosticoResponseDTO> listarTodos() {
        List<Diagnostico> diagnosticos = diagnosticoRepository.findAll();

        return diagnosticos.stream().map(diag -> {
            DiagnosticoResponseDTO dto = new DiagnosticoResponseDTO();
            
            dto.setId(diag.getIdDiagnostico());
            dto.setDate(diag.getGdhDiagnostico());
            dto.setTemperatura(diag.getTemperatura());
            dto.setBpm(diag.getBpm());
            dto.setMagnitudeG(diag.getMagnitudeG());
            dto.setRelacaoCausaEfeito(diag.getRelacaoCausaEfeito());

            if (diag.getConsulta() != null) {
                dto.setStatus(diag.getConsulta().getObservacoes());
                
                if (diag.getConsulta().getPaciente() != null) {
                    dto.setPatient(diag.getConsulta().getPaciente().getNome());
                } else {
                    dto.setPatient("Paciente não associado");
                }
            } else {
                dto.setStatus("Sem observações");
                dto.setPatient("Sem consulta associada");
            }
            return dto;
        }).collect(Collectors.toList());
    }
}