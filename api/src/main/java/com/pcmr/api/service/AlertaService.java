package com.pcmr.api.service;

import com.pcmr.api.dto.AlertaRequestDTO;
import com.pcmr.api.dto.AlertaResponseDTO;
import com.pcmr.api.model.AlertaClinico;
import com.pcmr.api.model.Sensor;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.AlertaClinicoRepository;
import com.pcmr.api.repository.SensorRepository;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
            Utilizador medico = userRepository.findById(Long.valueOf(dto.getIdMedico()))
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

    public List<AlertaResponseDTO> listarPorDispositivo(String deviceId, LocalDateTime desde) {
        List<AlertaClinico> alertas = alertaRepository
                .findBySensor_NomeAndDataHoraAfterOrderByDataHoraDesc(deviceId, desde);

        return alertas.stream().map(a -> new AlertaResponseDTO(
                a.getIdAlerta(),
                a.getTipoAlerta(),
                a.getValorRegistado(),
                a.getMensagem(),
                a.getDataHora().toString()
        )).collect(Collectors.toList());
    }

    /**
     * NEW: Listar os alertas mais recentes (usado pelo frontend)
     */
    public List<AlertaResponseDTO> listarRecentes(int limite) {
        Pageable pageable = PageRequest.of(0, limite);
        
        List<AlertaClinico> alertas = alertaRepository.findRecentAlerts(pageable);

        return alertas.stream().map(a -> new AlertaResponseDTO(
                a.getIdAlerta(),
                a.getTipoAlerta(),
                a.getValorRegistado(),
                a.getMensagem(),
                a.getDataHora().toString()
        )).collect(Collectors.toList());
    }
}