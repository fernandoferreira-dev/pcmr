package com.pcmr.api.controller;
import org.springframework.web.server.ResponseStatusException;
import com.pcmr.api.dto.EstadoSensorDTO;
import com.pcmr.api.dto.NovoSensorRequestDTO;
import com.pcmr.api.dto.SensorDTO;
import com.pcmr.api.model.Sensor;
import com.pcmr.api.repository.SensorRepository;
import com.pcmr.api.service.AtividadeSensorService;
import com.pcmr.api.service.LeituraSensorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sensores")
public class SensorController {

    @Autowired
    private LeituraSensorService leituraSensorService;

    @Autowired
    private AtividadeSensorService atividadeSensorService;

    @Autowired
    private SensorRepository sensorRepository;

    private static final long LIMITE_ONLINE_SEGUNDOS = 5; //cada 5 segundos porque o chefe disse

    @GetMapping
    public ResponseEntity<List<SensorDTO>> listar() {
        List<SensorDTO> dtos = sensorRepository.findAll().stream()
                .map(s -> new SensorDTO(s.getIdSensor(), s.getNome(), s.getLocalizacao(), s.getEstado()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody NovoSensorRequestDTO req) {
        if (req.getNome() == null || req.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Nome do sensor é obrigatório"));
        }

        if (sensorRepository.findByNome(req.getNome()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "erro", "Já existe um sensor com este nome/identificador"
            ));
        }

        Sensor novo = new Sensor();
        novo.setNome(req.getNome());
        novo.setLocalizacao(req.getLocalizacao());
        novo.setEstado("ATIVO");

        Sensor guardado = sensorRepository.save(novo);
        return ResponseEntity.ok(new SensorDTO(
                guardado.getIdSensor(), guardado.getNome(), guardado.getLocalizacao(), guardado.getEstado()
        ));
    }

    @GetMapping("/{deviceId}/ultima-leitura")
    public ResponseEntity<?> ultimaLeitura(@PathVariable String deviceId) {
        LeituraSensorService.LeituraAtual leitura = leituraSensorService.getUltimaLeitura(deviceId);

        if (leitura == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "erro", "Ainda não há leituras deste dispositivo"
            ));
        }

        return ResponseEntity.ok(leitura);
    }

    @GetMapping("/{idSensor}/ping")
    public ResponseEntity<EstadoSensorDTO> ping(@PathVariable Long idSensor) {
        Sensor sensor = sensorRepository.findById(idSensor)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String deviceId = sensor.getNome();

        LeituraSensorService.LeituraAtual leitura = leituraSensorService.getUltimaLeitura(deviceId);
        OffsetDateTime ultimaOcorrencia = (leitura != null)
            ? leitura.getAtualizadoEm()
            : atividadeSensorService.getUltimaAtividade(deviceId);

        EstadoSensorDTO dto = new EstadoSensorDTO();
        dto.setDeviceId(deviceId);

        if (ultimaOcorrencia == null) {
            dto.setOnline(false);
            dto.setUltimaLeitura(null);
            dto.setSegundosDesdeUltimaLeitura(-1);
            return ResponseEntity.ok(dto);
        }
    
        long segundos = Duration.between(ultimaOcorrencia, OffsetDateTime.now()).getSeconds();
        dto.setOnline(segundos <= LIMITE_ONLINE_SEGUNDOS);
        dto.setUltimaLeitura(ultimaOcorrencia.toString());
        dto.setSegundosDesdeUltimaLeitura(segundos);
    
        return ResponseEntity.ok(dto);
}

    @GetMapping("/procurar")
    public ResponseEntity<List<SensorDTO>> procurarSensores(
        @RequestParam String nome,
        @RequestParam(required = false) Long excluirId
    ) {
        List<Sensor> resultados = sensorRepository.findByNomeContainingIgnoreCase(nome);

        List<SensorDTO> dtos = resultados.stream()
            .filter(s -> excluirId == null || !s.getIdSensor().equals(excluirId))
            .map(s -> new SensorDTO(
                    s.getIdSensor(), s.getNome(), s.getLocalizacao(), s.getEstado()
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}