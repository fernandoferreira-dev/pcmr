package com.pcmr.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.pcmr.api.dto.NotificationDTO;
import com.pcmr.api.model.Notification;
import com.pcmr.api.repository.NotificationRepository;
import com.pcmr.api.websocket.NotificationWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationWebSocketHandler webSocketHandler;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    
    public NotificationDTO criarNotificacao(String titulo, String corpo, String origem, Notification.Severidade severidade) {
        Notification notification = new Notification();
        notification.setTitulo(titulo);
        notification.setCorpo(corpo);
        notification.setOrigem(origem);
        notification.setSeveridade(severidade);

        Notification guardada = notificationRepository.save(notification);
        NotificationDTO dto = new NotificationDTO(guardada);

        enviarPeloWebSocket(dto);

        return dto;
    }

    public List<NotificationDTO> listarHistorico() {
        return notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(NotificationDTO::new)
                .toList();
    }

    public List<NotificationDTO> listarNaoLidas() {
        return notificationRepository.findByLidaFalseOrderByCreatedAtDesc()
                .stream()
                .map(NotificationDTO::new)
                .toList();
    }

    public NotificationDTO marcarComoLida(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada: " + id));

        notification.setLida(true);
        Notification guardada = notificationRepository.save(notification);
        return new NotificationDTO(guardada);
    }

    private void enviarPeloWebSocket(NotificationDTO dto) {
        try {
            String json = objectMapper.writeValueAsString(dto);
            webSocketHandler.broadcast(json);
        } catch (Exception e) {
            System.err.println("Erro ao serializar/enviar notificação via WebSocket: " + e.getMessage());
        }
    }
}