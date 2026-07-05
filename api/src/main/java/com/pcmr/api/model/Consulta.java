package com.pcmr.api.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "consulta")
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_consulta")
    private Long idConsulta;

    @Column(name = "gdh_consulta", nullable = false)
    private OffsetDateTime gdhConsulta = OffsetDateTime.now();

    @ManyToOne
    @JoinColumn(name = "id_pessoa_medico", nullable = false)
    private Pessoa medico;

    @ManyToOne
    @JoinColumn(name = "id_pessoa_paciente", nullable = false)
    private Pessoa paciente;

    @Column(name = "observacoes")
    private String observacoes;

    public Long getIdConsulta() { return idConsulta; }
    public void setIdConsulta(Long idConsulta) { this.idConsulta = idConsulta; }

    public OffsetDateTime getGdhConsulta() { return gdhConsulta; }
    public void setGdhConsulta(OffsetDateTime gdhConsulta) { this.gdhConsulta = gdhConsulta; }

    public Pessoa getMedico() { return medico; }
    public void setMedico(Pessoa medico) { this.medico = medico; }

    public Pessoa getPaciente() { return paciente; }
    public void setPaciente(Pessoa paciente) { this.paciente = paciente; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}