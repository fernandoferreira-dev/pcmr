package com.pcmr.api.dto;

import java.util.List;

public class EstatisticasOverviewDTO {
    private long totalDiagnosticos;
    private long totalPacientes;
    private List<DiagnosticosPorMesDTO> diagnosticosPorMes;

    public static class DiagnosticosPorMesDTO {
        private String mes; // formato "yyyy-MM"
        private long quantidade;

        public DiagnosticosPorMesDTO() {}

        public DiagnosticosPorMesDTO(String mes, long quantidade) {
            this.mes = mes;
            this.quantidade = quantidade;
        }

        public String getMes() { return mes; }
        public void setMes(String mes) { this.mes = mes; }
        public long getQuantidade() { return quantidade; }
        public void setQuantidade(long quantidade) { this.quantidade = quantidade; }
    }

    public long getTotalDiagnosticos() { return totalDiagnosticos; }
    public void setTotalDiagnosticos(long totalDiagnosticos) { this.totalDiagnosticos = totalDiagnosticos; }

    public long getTotalPacientes() { return totalPacientes; }
    public void setTotalPacientes(long totalPacientes) { this.totalPacientes = totalPacientes; }

    public List<DiagnosticosPorMesDTO> getDiagnosticosPorMes() { return diagnosticosPorMes; }
    public void setDiagnosticosPorMes(List<DiagnosticosPorMesDTO> diagnosticosPorMes) { this.diagnosticosPorMes = diagnosticosPorMes; }
}