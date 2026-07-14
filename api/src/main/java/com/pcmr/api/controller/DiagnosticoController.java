package com.pcmr.api.controller;

import com.pcmr.api.dto.DiagnosticoResponseDTO;
import com.pcmr.api.dto.HistoricoSensorDTO;
import com.pcmr.api.model.Diagnostico;
import com.pcmr.api.model.HistoricoSensor;
import com.pcmr.api.repository.DiagnosticoRepository;
import com.pcmr.api.repository.HistoricoSensorRepository;
import com.pcmr.api.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/diagnosticos")
@CrossOrigin(origins = "*")
public class DiagnosticoController {

    @Autowired
    private DiagnosticoRepository diagnosticoRepository;

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private HistoricoSensorRepository historicoSensorRepository;

    @GetMapping
    public List<DiagnosticoResponseDTO> listarTodos(@RequestParam(required = false) Long idPaciente) {
        if (idPaciente != null) {
            return mapearParaDTO(
                    diagnosticoRepository.findByConsulta_Paciente_IdPessoaOrderByGdhDiagnosticoDesc(idPaciente)
            );
        }
        return mapearParaDTO(diagnosticoRepository.findAll());
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        List<DiagnosticoResponseDTO> diagnosticos = mapearParaDTO(diagnosticoRepository.findAll());

        return Map.of(
                "totalDiagnosticos", diagnosticoRepository.count(),
                "totalPacientes", pessoaRepository.countPacientes(),
                "diagnosticos", diagnosticos
        );
    }

    @GetMapping("/{id}/historico")
    public ResponseEntity<?> historico(@PathVariable Long id) {
        if (diagnosticoRepository.findById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "erro", "Diagnóstico não encontrado"
            ));
        }

        List<HistoricoSensor> pontos = historicoSensorRepository
                .findByDiagnosticoIdDiagnosticoOrderByGdhLeituraAsc(id);

        List<HistoricoSensorDTO> dto = pontos.stream()
                .map(p -> new HistoricoSensorDTO(p.getGdhLeitura(), p.getTemperatura(), p.getBpm(), p.getMagnitudeG()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    private List<DiagnosticoResponseDTO> mapearParaDTO(List<Diagnostico> diagnosticos) {
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
