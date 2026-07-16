import { useEffect, useRef, useState } from "react";
import "../../styles/diagnostic-data-styles/data-table-styles.css";

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

export default function DiagnosticsTableComponent() {

    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [exportandoId, setExportandoId] = useState<number | null>(null);
    const [dadosExport, setDadosExport] = useState<PontoGraficoExport[] | null>(null);
    const [diagnosticoExport, setDiagnosticoExport] = useState<Diagnostic | null>(null);

    const chartRef = useRef<HTMLDivElement>(null);

    const loadDiagnostics = () => {

        setLoading(true);

        fetch("http://localhost:8080/api/diagnosticos")
            .then(async (response) => {

                if (!response.ok) {
                    throw new Error("Unable to load diagnostics");
                }

                const data = await response.json() as DiagnosticoResponseDTO[];

                const diagnosticsMapped: Diagnostic[] = data.map(item => ({
                    id: item.id,
                    patient: item.patient || "",
                    date: item.date || "",
                    status: item.status || "",
                    cause: item.relacaoCausaEfeito || "",
                }));

                setDiagnostics(diagnosticsMapped);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError("Não foi possível carregar os diagnósticos.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadDiagnostics();
    }, []);

    const formatDate = (isoDate: string) => {

        if (!isoDate) return "";

        const parsed = new Date(isoDate);

        if (isNaN(parsed.getTime()))
            return isoDate;

        return (
            parsed.toLocaleDateString("pt-PT") +
            " " +
            parsed.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    };

    const filteredDiagnostics = diagnostics.filter((diagnostic) => {

        const query = search.toLowerCase();
        return (
            diagnostic.patient.toLowerCase().includes(query) ||
            formatDate(diagnostic.date).toLowerCase().includes(query) ||
            diagnostic.status.toLowerCase().includes(query) ||
            diagnostic.cause.toLowerCase().includes(query)
        );
    });

    const iniciarExportacao = async (diagnostic: Diagnostic) => {
        setExportandoId(diagnostic.id);
        setDiagnosticoExport(diagnostic);
        setDadosExport(null);

        try {
            const response = await fetch(
                `http://localhost:8080/api/diagnosticos/${diagnostic.id}/historico`
            );
            if (!response.ok) {
                alert("Não foi possível obter o histórico deste diagnóstico.");
                setExportandoId(null);
                return;
            }

            const historico: PontoHistorico[] = await response.json();

            const pontos: PontoGraficoExport[] = historico.map(item => ({
                hora: new Date(item.gdhLeitura).toLocaleTimeString("pt-PT"),
                temperatura: item.temperatura,
                bpm: item.bpm,
                magnitudeG: item.magnitudeG,
            }));
            setDadosExport(pontos);
        } catch (err) {
            console.error(err);
            alert("Erro ao carregar o histórico.");
            setExportandoId(null);
        }
    };

    useEffect(() => {
        if (!dadosExport || !diagnosticoExport || !chartRef.current)
            return;

        const gerarPDF = async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
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
                doc.text(`Diagnóstico #${diagnosticoExport.id}`, 15, 30);
                doc.text(`Paciente: ${diagnosticoExport.patient}`, 15, 37);
                doc.text(`Data: ${formatDate(diagnosticoExport.date)}`, 15, 44);
                doc.setFontSize(12);
                doc.text("Observações:", 15, 55);
                doc.setFontSize(10);

                const linhas = doc.splitTextToSize(
                    diagnosticoExport.status || "Sem observações",
                    180
                );

                doc.text(linhas, 15, 62);

                const alturaTexto = linhas.length * 5;
                const yGrafico = 62 + alturaTexto + 10;

                doc.setFontSize(12);
                doc.text(
                    "Evolução dos Sensores durante a Consulta:",
                    15,
                    yGrafico
                );

                const largura = 180;
                const altura = (canvas.height / canvas.width) * largura;

                doc.addImage(
                    imagem,
                    "PNG",
                    15,
                    yGrafico + 5,
                    largura,
                    altura
                );
                doc.save(`diagnostico_${diagnosticoExport.id}.pdf`);
            } catch (err) {
                console.error(err);
                alert("Erro ao gerar PDF.");
            } finally {
                setExportandoId(null);
                setDadosExport(null);
                setDiagnosticoExport(null);
            }
        };
        gerarPDF();
    }, [dadosExport, diagnosticoExport]);
    return (
        <>
            <div className="search-container">
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Filtrar consultas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    className="search-button"
                    onClick={loadDiagnostics}
                >
                    Atualizar
                </button>
            </div>
            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}
            <section className="table-section">
                <h1 className="table-title">
                    Histórico de Diagnósticos
                </h1>
                <div className="table-wrapper">
                    <div className="table-scroll">
                        <div className="table-container">
                            <div className="table-header">
                                <span>Paciente</span>
                                <span>Horário</span>
                                <span>Observações</span>
                                <span>Causa-Efeito</span>
                            </div>
                            <div className="table-body">
                                {loading ? (
                                    <p className="table-loading">
                                        A carregar dados...
                                    </p>
                                ) : filteredDiagnostics.length === 0 ? (
                                    <p className="table-empty">
                                        Nenhum diagnóstico encontrado.
                                    </p>
                                ) : (
                                    filteredDiagnostics.map((diagnostic) => (
                                        <div
                                            key={diagnostic.id}
                                            className="table-row"
                                        >
                                            <div className="table-patient">
                                                <button
                                                    className="export-button"
                                                    onClick={() => iniciarExportacao(diagnostic)}
                                                    disabled={exportandoId !== null}
                                                >
                                                    {exportandoId === diagnostic.id
                                                        ? "A exportar..."
                                                        : "Exportar"}
                                                </button>
                                                <span className="patient-name">
                                                    {diagnostic.patient}
                                                </span>
                                            </div>
                                            <span>
                                                {formatDate(diagnostic.date)}
                                            </span>
                                            <span
                                                className="table-status"
                                                title={diagnostic.status}
                                            >
                                                {diagnostic.status}
                                            </span>
                                            <span
                                                className="table-status"
                                                title={diagnostic.cause}
                                            >

                                                {diagnostic.cause}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {dadosExport && (
                <div className="hidden-chart">
                    <div
                        ref={chartRef}
                        className="hidden-chart-inner"
                    >
                        <LineChart
                            width={668}
                            height={318}
                            data={dadosExport}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                dataKey="hora"
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis
                                yAxisId="temp"
                                tick={{ fontSize: 11 }}
                                width={40}
                            />
                            <YAxis
                                yAxisId="bpm"
                                orientation="right"
                                tick={{ fontSize: 11 }}
                                width={40}
                            />
                            <Tooltip />
                            <Legend
                                wrapperStyle={{ fontSize: 12 }}
                            />
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
        </>
    );
}