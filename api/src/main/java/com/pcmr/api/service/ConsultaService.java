package com.pcmr.api.service;

import com.pcmr.api.dto.FinalizarConsultaRequestDTO;
import com.pcmr.api.model.*;
import com.pcmr.api.repository.*;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsultaService {

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private DiagnosticoRepository diagnosticoRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private LeituraSensorService leituraSensorService;

    @Transactional
    public Diagnostico finalizarConsulta(FinalizarConsultaRequestDTO req) {
        if (req.getIdMedico() == null) {
            throw new IllegalArgumentException("idMedico é obrigatório");
        }

        Pessoa medico = pessoaRepository
            .findById(req.getIdMedico())
            .orElseThrow(() ->
                new IllegalArgumentException("Médico não encontrado")
            );

        Pessoa paciente = resolverPaciente(req);

        Consulta consulta = new Consulta();
        consulta.setMedico(medico);
        consulta.setPaciente(paciente);
        consulta.setObservacoes(req.getObservacoes());
        consulta = consultaRepository.save(consulta);

        Sensor sensor = sensorRepository
            .findByNome(req.getDeviceId())
            .orElseGet(() -> {
                Sensor novo = new Sensor();
                novo.setNome(req.getDeviceId());
                novo.setEstado("ATIVO");
                return sensorRepository.save(novo);
            });

        LeituraSensorService.MediaLeituras media =
            leituraSensorService.getMediaLeituras(req.getDeviceId());
        if (media == null) {
            throw new IllegalStateException(
                "Não há leituras registadas para este dispositivo"
            );
        }

        Diagnostico diagnostico = new Diagnostico();
        diagnostico.setConsulta(consulta);
        diagnostico.setSensor(sensor);
        diagnostico.setTemperatura(BigDecimal.valueOf(media.temperaturaMedia));
        diagnostico.setBpm(media.bpmMedio);
        diagnostico.setMagnitudeG(BigDecimal.valueOf(media.magnitudeGMedia));
        diagnostico.setRelacaoCausaEfeito(
            media.alertaQuedaOcorreu
                ? "Alerta de queda ativo durante a consulta (" +
                      media.numeroLeituras +
                      " leituras)"
                : null
        );

        Diagnostico guardado = diagnosticoRepository.save(diagnostico);
        leituraSensorService.limparAcumulador(req.getDeviceId());
        return guardado;
    }

    private Pessoa resolverPaciente(FinalizarConsultaRequestDTO req) {
        if (req.getIdPacienteExistente() != null) {
            return pessoaRepository
                .findById(req.getIdPacienteExistente())
                .orElseThrow(() ->
                    new IllegalArgumentException("Paciente não encontrado")
                );
        }

        if (req.getNovoPaciente() != null) {
            var dto = req.getNovoPaciente();
            if (dto.getNome() == null || dto.getNome().isBlank()) {
                throw new IllegalArgumentException(
                    "Nome do novo paciente é obrigatório"
                );
            }
            if (dto.getEmail() == null || dto.getEmail().isBlank()) {
                throw new IllegalArgumentException(
                    "Email do novo paciente é obrigatório"
                );
            }

            Pessoa novaPessoa = new Pessoa();
            novaPessoa.setNome(dto.getNome());
            novaPessoa.setEmail(dto.getEmail());
            return pessoaRepository.save(novaPessoa);
        }

        throw new IllegalArgumentException(
            "É necessário indicar um paciente existente ou os dados de um novo paciente"
        );
    }
}
