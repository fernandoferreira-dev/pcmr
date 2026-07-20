package com.pcmr.api.controller;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.pcmr.api.model.AlertaClinico;
import com.pcmr.api.model.Diagnostico;
import com.pcmr.api.model.HistoricoSensor;
import com.pcmr.api.repository.AlertaClinicoRepository;
import com.pcmr.api.repository.DiagnosticoRepository;
import com.pcmr.api.repository.HistoricoSensorRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/diagnosticos")
@CrossOrigin(origins = "*")
public class DiagnosticoExportController {

    @Autowired
    private DiagnosticoRepository diagnosticoRepository;

    @Autowired
    private HistoricoSensorRepository historicoSensorRepository;

    @Autowired
    private AlertaClinicoRepository alertaClinicoRepository;

    @GetMapping("/{id}/exportar")
    public void exportarPdf(@PathVariable Long id, HttpServletResponse response) {
        try {
            Diagnostico diag = diagnosticoRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Diagnóstico não encontrado"));

            List<HistoricoSensor> historico = historicoSensorRepository
                    .findByDiagnosticoIdDiagnosticoOrderByGdhLeituraAsc(id);

            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=diagnostico_" + id + ".pdf");

            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, response.getOutputStream());
            document.open();

            Font tituloFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font alertaFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.RED);

            document.add(new Paragraph("RELATÓRIO DE DIAGNÓSTICO MÉDICO", tituloFont));
            document.add(new Paragraph("Data da Consulta: " + diag.getGdhDiagnostico().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), normalFont));
            document.add(new Paragraph("Paciente: " + diag.getConsulta().getPaciente().getNome(), normalFont));
            document.add(new Paragraph("Médico Responsável: " + diag.getConsulta().getMedico().getNome(), normalFont));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("Observações Clínicas:", subFont));
            String obs = diag.getConsulta().getObservacoes();
            document.add(new Paragraph((obs == null || obs.isBlank()) ? "Nenhuma observação registada." : obs, normalFont));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("Resumo das Métricas Obtidas (Médias Gerais):", subFont));
            document.add(new Paragraph("• Temperatura Média: " + diag.getTemperatura() + " °C", normalFont));
            document.add(new Paragraph("• Frequência Cardíaca Média: " + diag.getBpm() + " bpm", normalFont));
            document.add(new Paragraph("• Magnitude de Aceleração Média: " + diag.getMagnitudeG() + " G", normalFont));
            if (diag.getRelacaoCausaEfeito() != null) {
                document.add(new Paragraph("• Eventos Notificados: " + diag.getRelacaoCausaEfeito(), normalFont));
            }
            document.add(new Paragraph("\n"));
            
            if (!historico.isEmpty()) {
                var inicio = historico.get(0).getGdhLeitura().toLocalDateTime().minusSeconds(1);
                var fim = historico.get(historico.size() - 1).getGdhLeitura().toLocalDateTime().plusSeconds(1);

                List<AlertaClinico> alertas = alertaClinicoRepository
                        .findBySensor_IdSensorAndDataHoraBetweenOrderByDataHoraAsc(
                                diag.getSensor().getIdSensor(), inicio, fim
                        );

                if (alertas != null && !alertas.isEmpty()) {
                    document.add(new Paragraph("⚠ Alertas Registados Durante a Consulta:", subFont));
                    DateTimeFormatter horaFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

                    for (AlertaClinico a : alertas) {
                        String linha = String.format(
                                "[%s] %s: %s",
                                a.getDataHora().format(horaFormatter),
                                a.getTipoAlerta() != null ? a.getTipoAlerta().replace("_", " ") : "ALERTA",
                                a.getMensagem()
                        );
                        document.add(new Paragraph(linha, alertaFont));
                    }
                    document.add(new Paragraph("\n"));
                } else {
                    document.add(new Paragraph("Nenhum alerta crítico detetado nesta sessão.", normalFont));
                    document.add(new Paragraph("\n"));
                }
            }

            if (!historico.isEmpty()) {
                document.add(new Paragraph("Evolução Cinética dos Sensores:", subFont));
                DefaultCategoryDataset dataset = new DefaultCategoryDataset();
                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

                for (HistoricoSensor h : historico) {
                    String horaStr = h.getGdhLeitura().format(timeFormatter);
                    dataset.addValue(h.getBpm(), "BPM", horaStr);
                    dataset.addValue(h.getTemperatura(), "Temperatura (°C)", horaStr);
                }

                JFreeChart lineChart = ChartFactory.createLineChart(
                        "Histórico Clínico Detalhado",
                        "Tempo (HH:mm:ss)", "Escala Métrica",
                        dataset, PlotOrientation.VERTICAL,
                        true, true, false);

                BufferedImage bufferedImage = lineChart.createBufferedImage(520, 320);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                javax.imageio.ImageIO.write(bufferedImage, "png", baos);
                Image chartImage = Image.getInstance(baos.toByteArray());
                document.add(chartImage);
            }

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}