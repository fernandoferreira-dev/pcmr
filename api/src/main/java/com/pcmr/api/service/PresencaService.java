package com.pcmr.api.service;

import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PresencaService {

    public static class EstadoPresenca {
        public boolean presente;
        public OffsetDateTime atualizadoEm;

        public EstadoPresenca(boolean presente, OffsetDateTime atualizadoEm) {
            this.presente = presente;
            this.atualizadoEm = atualizadoEm;
        }
    }

    // Só existe uma "sala"/estação de consulta por agora — estado único.
    private final AtomicReference<EstadoPresenca> estadoAtual =
            new AtomicReference<>(new EstadoPresenca(false, OffsetDateTime.now()));

    public void atualizarPresenca(boolean presente) {
        estadoAtual.set(new EstadoPresenca(presente, OffsetDateTime.now()));
    }

    public EstadoPresenca getEstadoAtual() {
        return estadoAtual.get();
    }
}