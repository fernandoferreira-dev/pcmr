package com.pcmr.api.controller;

import com.pcmr.api.model.Paciente;
import com.pcmr.api.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @GetMapping
    public Iterable<Paciente> listar() {
        return pacienteRepository.findAll();
    }

    public static class CriarPacienteRequest {
        public String nome;
        public String numeroProcesso;
    }

    @PostMapping
    public Paciente criar(@RequestBody CriarPacienteRequest request) {
        Paciente paciente = new Paciente();
        paciente.setNome(request.nome);
        paciente.setNumeroProcesso(request.numeroProcesso);
        return pacienteRepository.save(paciente);
    }
}