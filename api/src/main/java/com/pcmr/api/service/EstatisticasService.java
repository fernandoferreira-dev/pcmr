package com.pcmr.api.service;

import com.pcmr.api.dto.EstatisticasOverviewDTO;
import com.pcmr.api.repository.DiagnosticoRepository;
import com.pcmr.api.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EstatisticasService {

    @Autowired
    private DiagnosticoRepository diagnosticoRepository;

    @Autowired
    private PessoaRepository pessoaRepository;

    public EstatisticasOverviewDTO obterOverview() {
        EstatisticasOverviewDTO dto = new EstatisticasOverviewDTO();

        dto.setTotalDiagnosticos(diagnosticoRepository.count());
        dto.setTotalPacientes(pessoaRepository.countPacientes());

        List<EstatisticasOverviewDTO.DiagnosticosPorMesDTO> porMes = new ArrayList<>();
        for (Object[] linha : diagnosticoRepository.countPorMes()) {
            String mes = (String) linha[0];
            long quantidade = ((Number) linha[1]).longValue();
            porMes.add(new EstatisticasOverviewDTO.DiagnosticosPorMesDTO(mes, quantidade));
        }
        dto.setDiagnosticosPorMes(porMes);

        return dto;
    }
}