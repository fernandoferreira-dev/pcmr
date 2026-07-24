import {
  BadgePlus,
  ClipboardList,
  CalendarDays,
  Stethoscope,
  Search,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
import { useTranslation } from "react-i18next";

interface Diagnostico {
  id: number;
  patient: string;
  date: string;
  status: string;
}

interface DashboardData {
  totalPacientes: number;
  totalDiagnosticos: number;
  diagnosticos: Diagnostico[];
}

interface PontoHistorico {
  gdhLeitura: string;
  temperatura: number;
  bpm: number;
  magnitudeG: number;
}

interface PontoGraficoExport {
  hora: string;
  temperatura: number;
  bpm: number;
  magnitudeG: number;
}

export default function DadosDiagnostico() {
  const [data, setData] = useState<DashboardData>({
    totalPacientes: 0,
    totalDiagnosticos: 0,
    diagnosticos: [],
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroNome, setFiltroNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [exportandoId, setExportandoId] = useState<number | null>(null);
  const [dadosExport, setDadosExport] = useState<PontoGraficoExport[] | null>(null);
  const [diagnosticoExport, setDiagnosticoExport] = useState<Diagnostico | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/diagnosticos/dashboard")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((result: DashboardData) => {
        setData(result);
        setErro(null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados do dashboard:", error);
        setErro("Não foi possível carregar os dados de diagnóstico.");
        setLoading(false);
      });
  }, []);

  const formatarData = (dataIso: string) => {
    const dataObj = new Date(dataIso);
    return (
      dataObj.toLocaleDateString("pt-PT") +
      " " +
      dataObj.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const iniciarExportacao = async (item: Diagnostico) => {
    setExportandoId(item.id);
    setDiagnosticoExport(item);
    setDadosExport(null);

    try {
      const res = await fetch(`/api/diagnosticos/${item.id}/historico`);
      if (!res.ok) {
        alert("Não foi possível obter o histórico deste diagnóstico.");
        setExportandoId(null);
        return;
      }

      const pontos: PontoHistorico[] = await res.json();

      const dadosFormatados: PontoGraficoExport[] = pontos.map((p) => ({
        hora: new Date(p.gdhLeitura).toLocaleTimeString("pt-PT"),
        temperatura: p.temperatura,
        bpm: p.bpm,
        magnitudeG: p.magnitudeG,
      }));

      setDadosExport(dadosFormatados);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      alert("Erro de comunicação ao carregar o histórico.");
      setExportandoId(null);
    }
  };

  useEffect(() => {
    if (!dadosExport || !diagnosticoExport || !chartRef.current) return;

    const gerarPdf = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        const canvas = await html2canvas(chartRef.current!, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        const imagemGrafico = canvas.toDataURL("image/png");

        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        doc.setFontSize(18);
        doc.text("Relatório de Diagnóstico", 15, 20);

        doc.setFontSize(11);
        doc.text(`Diagnóstico #${diagnosticoExport.id}`, 15, 30);
        doc.text(`Paciente: ${diagnosticoExport.patient}`, 15, 37);
        doc.text(`Data: ${formatarData(diagnosticoExport.date)}`, 15, 44);

        doc.setFontSize(12);
        doc.text("Observações:", 15, 55);
        doc.setFontSize(10);
        const observacoesTexto = diagnosticoExport.status || "Sem observações";
        const linhasObservacoes = doc.splitTextToSize(observacoesTexto, 180);
        doc.text(linhasObservacoes, 15, 62);

        const alturaObservacoes = linhasObservacoes.length * 5;
        const yGrafico = 62 + alturaObservacoes + 10;

        doc.setFontSize(12);
        doc.text("Evolução dos Sensores durante a Consulta:", 15, yGrafico);

        const larguraImagem = 180;
        const alturaImagem = (canvas.height / canvas.width) * larguraImagem;
        doc.addImage(imagemGrafico, "PNG", 15, yGrafico + 5, larguraImagem, alturaImagem);

        doc.save(`diagnostico_${diagnosticoExport.id}.pdf`);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar o PDF.");
      } finally {
        setExportandoId(null);
        setDadosExport(null);
        setDiagnosticoExport(null);
      }
    };

    gerarPdf();
  }, [dadosExport, diagnosticoExport]);

  const diagnosticosFiltrados = data.diagnosticos.filter((item) => {
    const bateNome = item.patient.toLowerCase().includes(filtroNome.toLowerCase());

    const dataItemFormatada = item.date.split("T")[0];
    const bateInicio = dataInicio ? dataItemFormatada >= dataInicio : true;
    const bateFim = dataFim ? dataItemFormatada <= dataFim : true;

    return bateNome && bateInicio && bateFim;
  });

  return (
    <div className="relative flex flex-col w-full h-full p-6 bg-[#EBEBEB] dark:bg-gray-800 rounded-4xl shadow-inner overflow-hidden">

      {erro && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-2xl px-4 py-3 text-sm shrink-0">
          {erro}
        </div>
      )}

      {/* Cards de Dashboard */}
      <section className="grid gap-4 md:grid-cols-2 mb-4 shrink-0">
        <article className="flex items-center justify-between rounded-3xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('diagnosticData.title')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-gray-100">
              {loading ? "..." : data.totalPacientes}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('diagnosticData.diagBDTotal')}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f7f2] dark:bg-gray-800 text-[#AAB99F]">
            <Stethoscope size={28} strokeWidth={1.8} />
          </div>
        </article>

        <article className="flex items-center justify-between rounded-3xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('diagnosticData.diagDiag')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-gray-100">
              {loading ? "..." : data.totalDiagnosticos}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('diagnosticData.diagTotalRegist')}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f7f2] dark:bg-gray-800 text-[#AAB99F]">
            <ClipboardList size={28} strokeWidth={1.8} />
          </div>
        </article>
      </section>

      {/* Barra de Filtros */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-300 dark:border-gray-700 p-4 mb-4 shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">

            {/* Campo de Busca por Nome */}
            <div className="flex flex-col gap-1">
              <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300">{t('diagnosticData.diagSearch')}</span>
              <span className="relative flex h-11 items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-gray-700 dark:text-gray-200 focus-within:ring-2 focus-within:ring-[#AAB99F]">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  className="bg-transparent text-sm outline-none w-full text-gray-700 dark:text-gray-200"
                  type="text"
                  placeholder={t('diagnosticData.diagPatientName')}
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                />
              </span>
            </div>

            {/* Data de Início */}
            <div className="flex flex-col gap-1">
              <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300">{t('diagnosticData.diagDateStart')}</span>
              <span className="relative flex h-11 items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-gray-700 dark:text-gray-200 focus-within:ring-2 focus-within:ring-[#AAB99F]">
                <CalendarDays size={16} className="text-gray-400" />
                <input
                  className="bg-transparent text-sm outline-none cursor-pointer text-gray-700 dark:text-gray-200 w-full"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </span>
            </div>

            {/* Data de Fim */}
            <div className="flex flex-col gap-1">
              <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300">{t('diagnosticData.diagDateEnd')}</span>
              <span className="relative flex h-11 items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-gray-700 dark:text-gray-200 focus-within:ring-2 focus-within:ring-[#AAB99F]">
                <CalendarDays size={16} className="text-gray-400" />
                <input
                  className="bg-transparent text-sm outline-none cursor-pointer text-gray-700 dark:text-gray-200 w-full"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </span>
            </div>
          </div>

          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#AAB99F] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#97a68d] cursor-pointer whitespace-nowrap">
            <BadgePlus size={16} />
            {t('diagnosticData.diagFilterActive')}
          </button>
        </div>
      </section>

      {/* Tabela de Histórico de Diagnósticos */}
      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="px-1 mb-3 text-lg font-bold text-gray-800 dark:text-gray-100">
          {t('diagnosticData.diagHistory')}
        </h2>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          {/* Cabeçalho da Grelha/Tabela */}
          <div className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr] gap-4 bg-[#AAB99F] px-5 py-3.5 text-sm font-bold text-white shrink-0">
            <span>ID</span>
            <span>{t('diagnosticData.diagPatient')}</span>
            <span>{t('diagnosticData.diagDate')}</span>
            <span>{t('diagnosticData.diagObs')}</span>
          </div>

          {/* Corpo da Grelha/Tabela com Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <p className="p-5 text-center text-sm text-gray-400">
                {t('diagnosticData.diagLoading')}
              </p>
            ) : diagnosticosFiltrados.length === 0 ? (
              <p className="p-5 text-center text-sm text-gray-400">
                {t('diagnosticData.diagDiagNotFound')}
              </p>
            ) : (
              diagnosticosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr] items-center gap-4 px-5 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => iniciarExportacao(item)}
                      disabled={exportandoId !== null}
                      className="inline-flex h-8 items-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exportandoId === item.id ? t('diagnosticData.diagExporting') : t('diagnosticData.diagExportButton')}
                    </button>
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      #{item.id}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{item.patient}</span>
                  <span className="text-gray-500 dark:text-gray-400">{formatarData(item.date)}</span>
                  <span className="truncate text-gray-500 dark:text-gray-400" title={item.status}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Gráfico oculto, usado apenas como fonte de captura para o PDF */}
      {dadosExport && (
        <div style={{ position: "fixed", top: "-9999px", left: "-9999px" }}>
          <div ref={chartRef} style={{ width: 700, height: 350, backgroundColor: "#ffffff", padding: 16 }}>
            <LineChart width={668} height={318} data={dadosExport}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="temp" tick={{ fontSize: 11 }} width={40} />
              <YAxis yAxisId="bpm" orientation="right" tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperatura"
                name={t('diagnosticData.diagTemp')}
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
                name={t('diagnosticData.diagMag')}
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