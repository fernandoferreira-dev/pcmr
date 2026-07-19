package com.pcmr.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "configuracao_presenca")
public class ConfiguracaoPresenca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracao")
    private Long idConfiguracao;

    @ManyToOne
    @JoinColumn(name = "id_sensor", nullable = false)
    private Sensor sensor;

    @Column(name = "distancia_deteccao_cm", nullable = false)
    private BigDecimal distanciaDeteccaoCm;

    @Column(name = "tempo_confirmacao_segundos", nullable = false)
    private Integer tempoConfirmacaoSegundos;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @Column(name = "id_utilizador_atualizou")
    private Long idUtilizadorAtualizou;

    public Long getIdConfiguracao() { return idConfiguracao; }
    public void setIdConfiguracao(Long idConfiguracao) { this.idConfiguracao = idConfiguracao; }

    public Sensor getSensor() { return sensor; }
    public void setSensor(Sensor sensor) { this.sensor = sensor; }

    public BigDecimal getDistanciaDeteccaoCm() { return distanciaDeteccaoCm; }
    public void setDistanciaDeteccaoCm(BigDecimal distanciaDeteccaoCm) { this.distanciaDeteccaoCm = distanciaDeteccaoCm; }

    public Integer getTempoConfirmacaoSegundos() { return tempoConfirmacaoSegundos; }
    public void setTempoConfirmacaoSegundos(Integer tempoConfirmacaoSegundos) { this.tempoConfirmacaoSegundos = tempoConfirmacaoSegundos; }

    public OffsetDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(OffsetDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }

    public Long getIdUtilizadorAtualizou() { return idUtilizadorAtualizou; }
    public void setIdUtilizadorAtualizou(Long idUtilizadorAtualizou) { this.idUtilizadorAtualizou = idUtilizadorAtualizou; }
}