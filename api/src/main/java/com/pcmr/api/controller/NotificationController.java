package com.pcmr.api.controller;

import com.pcmr.api.dto.NotificationDTO;
import com.pcmr.api.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // Histórico completo, para não se perder nada quando a página é refrescada
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> historico() {
        return ResponseEntity.ok(notificationService.listarHistorico());
    }

    @GetMapping("/nao-lidas")
    public ResponseEntity<List<NotificationDTO>> naoLidas() {
        return ResponseEntity.ok(notificationService.listarNaoLidas());
    }

    @PatchMapping("/{id}/lida")
    public ResponseEntity<?> marcarComoLida(@PathVariable Long id) {
        try {
            NotificationDTO dto = notificationService.marcarComoLida(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage()));
        }
    }
}