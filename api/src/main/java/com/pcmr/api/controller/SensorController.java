package com.pcmr.api.controller;

import com.pcmr.api.dto.EstadoSensorDTO;
import com.pcmr.api.service.LeituraSensorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/sensores")
public class SensorController {

    @Autowired
    private LeituraSensorService leituraSensorService;

    // Considera-se "online" se a última leitura chegou há menos deste tempo.
    // O ESP32 publica a cada 2s; 10s dá margem para 3-4 ciclos perdidos
    // por instabilidade de rede sem marcar como offline prematuramente.
    private static final long LIMITE_ONLINE_SEGUNDOS = 10;

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

    @GetMapping("/{deviceId}/ping")
    public ResponseEntity<EstadoSensorDTO> ping(@PathVariable String deviceId) {
        LeituraSensorService.LeituraAtual leitura = leituraSensorService.getUltimaLeitura(deviceId);

        EstadoSensorDTO dto = new EstadoSensorDTO();
        dto.setDeviceId(deviceId);

        if (leitura == null) {
            dto.setOnline(false);
            dto.setUltimaLeitura(null);
            dto.setSegundosDesdeUltimaLeitura(-1);
            return ResponseEntity.ok(dto);
        }

        long segundos = Duration.between(leitura.getAtualizadoEm(), OffsetDateTime.now()).getSeconds();

        dto.setOnline(segundos <= LIMITE_ONLINE_SEGUNDOS);
        dto.setUltimaLeitura(leitura.getAtualizadoEm().toString());
        dto.setSegundosDesdeUltimaLeitura(segundos);

        return ResponseEntity.ok(dto);
    }
}