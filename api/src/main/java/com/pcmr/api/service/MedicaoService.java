package com.pcmr.api.service;

import com.pcmr.api.dto.SensorReadingDTO;
import com.pcmr.api.model.EstadoMedicao;
import com.pcmr.api.model.Medicao;
import com.pcmr.api.model.Paciente;
import com.pcmr.api.repository.MedicaoRepository;
import com.pcmr.api.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class MedicaoService {

    @Autowired
    private MedicaoRepository medicaoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private MedicaoQueueService queueService;

    @Autowired
    private ScheduledExecutorService scheduledExecutorService;

    @Value("${medicao.duracao-segundos:30}")
    private int duracaoSegundosDefault;

    public Medicao iniciarMedicao(Long pacienteId, String deviceId) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new NoSuchElementException("Paciente não encontrado: " + pacienteId));

        Medicao medicao = new Medicao();
        medicao.setPaciente(paciente);
        medicao.setDeviceId(deviceId);
        medicao.setDuracaoSegundos(duracaoSegundosDefault);
        medicao = medicaoRepository.save(medicao);

        queueService.iniciarSessao(deviceId, medicao.getId(), pacienteId);

        Long medicaoId = medicao.getId();
        scheduledExecutorService.schedule(
                () -> finalizarMedicao(deviceId, medicaoId),
                duracaoSegundosDefault,
                TimeUnit.SECONDS
        );

        return medicao;
    }

    public void processarLeitura(String deviceId, SensorReadingDTO leitura) {
        queueService.registarLeitura(deviceId, leitura);
    }

    @Transactional
    public void finalizarMedicao(String deviceId, Long medicaoId) {
        MedicaoSession sessao = queueService.removerSessaoDoMedicao(deviceId, medicaoId);
        Medicao medicao = medicaoRepository.findById(medicaoId).orElse(null);
        if (medicao == null) return;

        if (sessao == null || sessao.getBpms().isEmpty()) {
            medicao.setEstado(EstadoMedicao.FALHADA);
        } else {
            medicao.setBpmMedio(media(sessao.getBpms()));
            medicao.setTemperaturaMedia(media(sessao.getTemperaturas()));
            medicao.setHumidadeMedia(media(sessao.getHumidades()));
            medicao.setNumAmostras(sessao.getBpms().size());
            medicao.setEstado(EstadoMedicao.CONCLUIDA);
        }
        medicao.setConcluidoEm(java.time.LocalDateTime.now());
        medicaoRepository.save(medicao);
    }

    private Double media(List<Double> valores) {
        if (valores == null || valores.isEmpty()) return null;
        return valores.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }
}