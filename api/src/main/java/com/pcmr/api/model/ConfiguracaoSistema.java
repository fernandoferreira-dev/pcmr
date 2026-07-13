package com.pcmr.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "configuracao_sistema")
public class ConfiguracaoSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracao")
    private Long idConfiguracao;

    @Column(name = "temperatura_max_alerta", nullable = false)
    private BigDecimal temperaturaMaxAlerta;

    @Column(name = "temperatura_min_alerta", nullable = false)
    private BigDecimal temperaturaMinAlerta;

    @Column(name = "bpm_max_alerta", nullable = false)
    private Integer bpmMaxAlerta;

    @Column(name = "bpm_min_alerta", nullable = false)
    private Integer bpmMinAlerta;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @Column(name = "id_utilizador_atualizou")
    private Long idUtilizadorAtualizou;

    public Long getIdConfiguracao() { return idConfiguracao; }
    public void setIdConfiguracao(Long idConfiguracao) { this.idConfiguracao = idConfiguracao; }

    public BigDecimal getTemperaturaMaxAlerta() { return temperaturaMaxAlerta; }
    public void setTemperaturaMaxAlerta(BigDecimal temperaturaMaxAlerta) { this.temperaturaMaxAlerta = temperaturaMaxAlerta; }

    public BigDecimal getTemperaturaMinAlerta() { return temperaturaMinAlerta; }
    public void setTemperaturaMinAlerta(BigDecimal temperaturaMinAlerta) { this.temperaturaMinAlerta = temperaturaMinAlerta; }

    public Integer getBpmMaxAlerta() { return bpmMaxAlerta; }
    public void setBpmMaxAlerta(Integer bpmMaxAlerta) { this.bpmMaxAlerta = bpmMaxAlerta; }

    public Integer getBpmMinAlerta() { return bpmMinAlerta; }
    public void setBpmMinAlerta(Integer bpmMinAlerta) { this.bpmMinAlerta = bpmMinAlerta; }

    public OffsetDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(OffsetDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }

    public Long getIdUtilizadorAtualizou() { return idUtilizadorAtualizou; }
    public void setIdUtilizadorAtualizou(Long idUtilizadorAtualizou) { this.idUtilizadorAtualizou = idUtilizadorAtualizou; }
}