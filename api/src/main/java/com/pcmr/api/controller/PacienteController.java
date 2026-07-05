package com.pcmr.api.controller;

import com.pcmr.api.model.Pessoa;
import com.pcmr.api.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    @Autowired
    private PessoaRepository pessoaRepository;

    @GetMapping("/procurar")
    public ResponseEntity<List<Pessoa>> procurar(@RequestParam(required = false) String nome) {
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.ok(pessoaRepository.findAll());
        }
        return ResponseEntity.ok(pessoaRepository.findByNomeContainingIgnoreCase(nome));
    }
}