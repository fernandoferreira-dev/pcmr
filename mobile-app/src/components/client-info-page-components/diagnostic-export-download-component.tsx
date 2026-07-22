import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Diagnostic = {
    id: number;
    patient: string;
    date: string;
    status: string;
    cause: string;
};

type DiagnosticoResponseDTO = {
    id: number;
    patient: string;
    date: string;
    status: string;
    relacaoCausaEfeito: string;
};

type PontoHistorico = {
    gdhLeitura: string;
    temperatura: number;
    bpm: number;
    magnitudeG: number;
};

type PontoGraficoExport = {
    hora: string;
    temperatura: number;
    bpm: number;
    magnitudeG: number;
};

// TODO: replace with your real deployed backend URL (not localhost)
//const API_BASE_URL = "http://localhost:8080";

type ExportStatus = "loading" | "generating" | "done" | "error";

export default function DiagnosticExportPage() {
    const { id } = useParams<{ id: string }>();

    const [status, setStatus] = useState<ExportStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [diagnostico, setDiagnostico] = useState<Diagnostic | null>(null);
    const [dados, setDados] = useState<PontoGraficoExport[] | null>(null);

    const chartRef = useRef<HTMLDivElement>(null);

    const formatDate = (isoDate: string) => {
        if (!isoDate) return "";
        const parsed = new Date(isoDate);
        if (isNaN(parsed.getTime())) return isoDate;
        return (
            parsed.toLocaleDateString("pt-PT") +
            " " +
            parsed.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    };

    // Step 1: on mount, fetch the diagnostic + its history
    useEffect(() => {
        if (!id) {
            setStatus("error");
            setErrorMessage("Nenhum diagnóstico especificado.");
            return;
        }

        const carregarDados = async () => {
            try {
                // There's no single-diagnostic JSON endpoint on the backend
                // (only the list endpoint and /{id}/historico), so fetch the
                // full list and pick out the matching id.
                const [listaResponse, historicoResponse] = await Promise.all([
                    //fetch(`${API_BASE_URL}/api/diagnosticos`),
                    //fetch(`${API_BASE_URL}/api/diagnosticos/${id}/historico`),
                    fetch(`/api/diagnosticos`),
                    fetch(`/api/diagnosticos/${id}/historico`),
                ]);

                if (!listaResponse.ok || !historicoResponse.ok) {
                    throw new Error("Falha ao obter dados do diagnóstico.");
                }

                const lista = (await listaResponse.json()) as DiagnosticoResponseDTO[];
                const historico = (await historicoResponse.json()) as PontoHistorico[];

                const diagData = lista.find((item) => String(item.id) === id);

                if (!diagData) {
                    throw new Error("Diagnóstico não encontrado.");
                }

                setDiagnostico({
                    id: diagData.id,
                    patient: diagData.patient || "",
                    date: diagData.date || "",
                    status: diagData.status || "",
                    cause: diagData.relacaoCausaEfeito || "",
                });

                const pontos: PontoGraficoExport[] = historico.map((item) => ({
                    hora: new Date(item.gdhLeitura).toLocaleTimeString("pt-PT"),
                    temperatura: item.temperatura,
                    bpm: item.bpm,
                    magnitudeG: item.magnitudeG,
                }));

                setDados(pontos);
                setStatus("generating");
            } catch (err) {
                console.error(err);
                setStatus("error");
                setErrorMessage("Não foi possível carregar os dados para exportação.");
            }
        };

        carregarDados();
    }, [id]);

    // Step 2: once data + chart are ready, render to canvas and generate the PDF
    useEffect(() => {
        if (status !== "generating" || !dados || !diagnostico || !chartRef.current) {
            return;
        }

        const gerarPDF = async () => {
            // small delay to make sure recharts has finished painting the SVG
            await new Promise((resolve) => setTimeout(resolve, 300));

            try {
                const canvas = await html2canvas(chartRef.current!, {
                    backgroundColor: "#ffffff",
                    scale: 2,
                });

                const imagem = canvas.toDataURL("image/png");

                const doc = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                });

                doc.setFontSize(18);
                doc.text("Relatório de Diagnóstico", 15, 20);
                doc.setFontSize(11);
                doc.text(`Diagnóstico #${diagnostico.id}`, 15, 30);
                doc.text(`Paciente: ${diagnostico.patient}`, 15, 37);
                doc.text(`Data: ${formatDate(diagnostico.date)}`, 15, 44);
                doc.setFontSize(12);
                doc.text("Observações:", 15, 55);
                doc.setFontSize(10);

                const linhas = doc.splitTextToSize(
                    diagnostico.status || "Sem observações",
                    180
                );
                doc.text(linhas, 15, 62);

                const alturaTexto = linhas.length * 5;
                const yGrafico = 62 + alturaTexto + 10;

                doc.setFontSize(12);
                doc.text("Evolução dos Sensores durante a Consulta:", 15, yGrafico);

                const largura = 180;
                const altura = (canvas.height / canvas.width) * largura;

                doc.addImage(imagem, "PNG", 15, yGrafico + 5, largura, altura);

                // Running in a real browser tab (opened via ActivityStarter),
                // so doc.save() works normally here — it doesn't inside the
                // App Inventor WebViewer.
                doc.save(`diagnostico_${diagnostico.id}.pdf`);

                setStatus("done");
            } catch (err) {
                console.error(err);
                setStatus("error");
                setErrorMessage("Erro ao gerar o PDF.");
            }
        };

        gerarPDF();
    }, [status, dados, diagnostico]);

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}>
            {status === "loading" && <p>A carregar dados do diagnóstico...</p>}
            {status === "generating" && <p>A gerar o PDF, aguarde um momento...</p>}
            {status === "done" && (
                <p>
                    PDF gerado com sucesso. Se o download não começou automaticamente,
                    verifique as definições de download do seu navegador.
                </p>
            )}
            {status === "error" && (
                <p style={{ color: "red" }}>
                    {errorMessage ?? "Ocorreu um erro ao exportar o diagnóstico."}
                </p>
            )}

            {/* Hidden chart used only to render the PNG for the PDF */}
            {dados && (
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    <div ref={chartRef}>
                        <LineChart width={668} height={318} data={dados}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="temp" tick={{ fontSize: 11 }} width={40} />
                            <YAxis
                                yAxisId="bpm"
                                orientation="right"
                                tick={{ fontSize: 11 }}
                                width={40}
                            />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                                yAxisId="temp"
                                type="monotone"
                                dataKey="temperatura"
                                name="Temperatura (°C)"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                            <Line
                                yAxisId="bpm"
                                type="monotone"
                                dataKey="bpm"
                                name="BPM"
                                stroke="#dc2626"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                            <Line
                                yAxisId="temp"
                                type="monotone"
                                dataKey="magnitudeG"
                                name="Magnitude (G)"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </div>
                </div>
            )}
        </div>
    );
}