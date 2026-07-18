package com.pcmr.api.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;


@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessoes = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessoes.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessoes.remove(session);
    }


    public void broadcast(String jsonPayload) {
        TextMessage message = new TextMessage(jsonPayload);
        for (WebSocketSession sessao : sessoes) {
            try {
                if (sessao.isOpen()) {
                    sessao.sendMessage(message);
                }
            } catch (IOException e) {
                System.err.println("Erro ao enviar notificação via WebSocket: " + e.getMessage());
            }
        }
    }
}