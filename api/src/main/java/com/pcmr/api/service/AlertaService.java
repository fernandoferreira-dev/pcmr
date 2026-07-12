package com.pcmr.api.service;

import com.pcmr.api.dto.AlertaRequestDTO;
import com.pcmr.api.model.AlertaClinico;
import com.pcmr.api.model.Sensor;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.AlertaClinicoRepository;
import com.pcmr.api.repository.SensorRepository;
import com.pcmr.api.repository.UserRepository; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AlertaService {

    @Autowired
    private AlertaClinicoRepository alertaRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SensorRepository sensorRepository;

    public void registarAlerta(AlertaRequestDTO dto) {
        AlertaClinico alerta = new AlertaClinico();

        if (dto.getIdMedico() != null) {
            Utilizador medico = userRepository.findById(dto.getIdMedico())
                    .orElseThrow(() -> new RuntimeException("Médico não encontrado. ID: " + dto.getIdMedico()));
            alerta.setMedico(medico);
        }

        Sensor sensor = sensorRepository.findByNome(dto.getDeviceId())
                .orElseThrow(() -> new RuntimeException("Sensor não encontrado. Nome: " + dto.getDeviceId()));
        alerta.setSensor(sensor);

        alerta.setTipoAlerta(dto.getTipoAlerta());
        alerta.setValorRegistado(dto.getValorRegistado());
        alerta.setMensagem(dto.getMensagem());

        alertaRepository.save(alerta);
    }
}