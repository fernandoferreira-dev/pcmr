package com.pcmr.api.dto;

public class FinalizarConsultaRequestDTO {
    private Long idMedico;
    private Long idPacienteExistente;
    private NovoPacienteDTO novoPaciente;
    private String deviceId;
    private String observacoes;

    public static class NovoPacienteDTO {
        private String nome;
        private String email;

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public Long getIdMedico() { return idMedico; }
    public void setIdMedico(Long idMedico) { this.idMedico = idMedico; }

    public Long getIdPacienteExistente() { return idPacienteExistente; }
    public void setIdPacienteExistente(Long idPacienteExistente) { this.idPacienteExistente = idPacienteExistente; }

    public NovoPacienteDTO getNovoPaciente() { return novoPaciente; }
    public void setNovoPaciente(NovoPacienteDTO novoPaciente) { this.novoPaciente = novoPaciente; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}