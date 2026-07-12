package com.pcmr.api.controller;

import com.pcmr.api.dto.FinalizarConsultaRequestDTO;
import com.pcmr.api.service.ConsultaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaController {

    @Autowired
    private ConsultaService consultaService;

    @PostMapping("/finalizar")
    public ResponseEntity<?> finalizar(@RequestBody FinalizarConsultaRequestDTO req) {
        try {
            ConsultaService.ResultadoFinalizacao resultado = consultaService.finalizarConsulta(req);
            
            Map<String, Object> resposta = new HashMap<>();
            resposta.put("sucesso", true);
            resposta.put("idDiagnostico", resultado.diagnostico.getIdDiagnostico());
            resposta.put("idConsulta", resultado.diagnostico.getConsulta().getIdConsulta());
            
            if (resultado.tokenAcesso != null) {
                resposta.put("tokenAcesso", resultado.tokenAcesso);
            }

            return ResponseEntity.ok(resposta);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erro", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "erro", "Erro ao finalizar consulta: " + e.getMessage()
            ));
        }
    }
}