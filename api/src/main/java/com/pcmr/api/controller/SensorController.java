package com.pcmr.api.controller;

import com.pcmr.api.service.LeituraSensorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sensores")
public class SensorController {

    @Autowired
    private LeituraSensorService leituraSensorService;

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
}