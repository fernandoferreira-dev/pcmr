import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import FinalizarConsultaModal from "../../components/dashboard/FinalizarConsultaModal";
import "../../styles/dashboard-styles/diagnostic-live-view-styles.css";

type EstadoAlertaTipo = "NORMAL" | "BAIXA" | "ALTA" | "BAIXO" | "ALTO";

interface EstadoAlerta {
  estado: EstadoAlertaTipo;
  mensagem: string | null;
  limiteMin: number;
  limiteMax: number;
}

interface LeituraSensor {
  temperatura: number;
  bpm: number;
  magnitudeG: number;
  fallState: number;
  alertaQuedaAtivo: boolean;
  atualizadoEm: string;
  alertaTemperatura?: EstadoAlerta | null;
  alertaBpm?: EstadoAlerta | null;
}

interface PontoGrafico {
  hora: string;
  temperatura: number;
  bpm: number;
  magnitudeG: number;
}

type MetricaKey = "temperatura" | "bpm" | "magnitudeG";

const POLL_INTERVAL_MS = 2000;
const DEVICE_ID = "wearable01";
const MAX_PONTOS_GRAFICO = 60; // últimos 2 minutos de histórico (60 * 2s)
const DURACAO_PULSO_MS = 700;
const TEMPO_CALIBRACAO_MS = 10000; // 10 segundos para calibração inicial

const FALL_STATE_LABELS: Record<number, string> = {
  0: "Repouso",
  1: "Queda livre detetada",
  2: "Impacto detetado",
  3: "A confirmar queda...",
};

const METRICAS: {
  key: MetricaKey;
  label: string;
  cor: string;
  unidade: string;
}[] = [
  { key: "temperatura", label: "Temperatura", cor: "#f97316", unidade: "°C" },
  { key: "bpm", label: "Frequência Cardíaca", cor: "#dc2626", unidade: "bpm" },
  {
    key: "magnitudeG",
    label: "Magnitude (aceleração)",
    cor: "#2563eb",
    unidade: "G",
  },
];

export default function DiagnosticoLiveView({
  onClose,
  idMedico,
}: {
  onClose: () => void;
  idMedico: number;
}) {
  const [leitura, setLeitura] = useState<LeituraSensor | null>(null);
  const [historico, setHistorico] = useState<PontoGrafico[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [metricaAtiva, setMetricaAtiva] = useState<MetricaKey>("temperatura");
  const [pulsando, setPulsando] = useState(false);

  // Estado para controlar se o período de calibração terminou
  const [calibrado, setCalibrado] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulsoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimaHoraRef = useRef<string | null>(null);

  // Temporizador para calibração inicial de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setCalibrado(true);
    }, TEMPO_CALIBRACAO_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const buscarLeitura = async () => {
      try {
        const res = await fetch(`/api/sensores/${DEVICE_ID}/ultima-leitura`);
        if (!res.ok) {
          setErro("Sem dados do dispositivo ainda.");
          return;
        }
        const data: LeituraSensor = await res.json();
        setLeitura(data);
        setErro(null);

        // Atualização do gráfico
        if (data.atualizadoEm !== ultimaHoraRef.current) {
          ultimaHoraRef.current = data.atualizadoEm;

          const novoPonto: PontoGrafico = {
            hora: new Date(data.atualizadoEm).toLocaleTimeString(),
            temperatura: data.temperatura,
            bpm: data.bpm,
            magnitudeG: data.magnitudeG,
          };

          setHistorico((prev) => {
            const atualizado = [...prev, novoPonto];
            return atualizado.length > MAX_PONTOS_GRAFICO
              ? atualizado.slice(atualizado.length - MAX_PONTOS_GRAFICO)
              : atualizado;
          });

          setPulsando(true);
          if (pulsoTimeoutRef.current) clearTimeout(pulsoTimeoutRef.current);
          pulsoTimeoutRef.current = setTimeout(
            () => setPulsando(false),
            DURACAO_PULSO_MS,
          );
        }
      } catch {
        setErro("Erro de comunicação com o servidor.");
      }
    };

    buscarLeitura();
    pollingRef.current = setInterval(buscarLeitura, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (pulsoTimeoutRef.current) clearTimeout(pulsoTimeoutRef.current);
    };
  }, [idMedico]);

  const metrica = METRICAS.find((m) => m.key === metricaAtiva)!;

  const mensagemAlertaTemp =
    calibrado && leitura?.alertaTemperatura && leitura.alertaTemperatura.estado !== "NORMAL"
      ? leitura.alertaTemperatura.mensagem
      : null;

  const mensagemAlertaBpm =
    calibrado && leitura?.alertaBpm && leitura.alertaBpm.estado !== "NORMAL"
      ? leitura.alertaBpm.mensagem
      : null;

  return (
    <div className="diag-root">
      <header className="diag-header">
        <h1 className="diag-title">
          Consulta Rápida — Dados em Tempo Real
        </h1>
        <button
          onClick={onClose}
          className="diag-close-btn"
          title="Fechar"
        >
          ✕
        </button>
      </header>

      <div className="end-consulta">
        <button
          disabled={!leitura}
          onClick={() => setMostrarFinalizar(true)}
          className="diag-finalizar-btn"
        >
          Terminar Consulta
        </button>
      </div>

      {/* Main agora é fixo, sem afetar ou esmagar o layout original */}
      <main className="diag-main">
        {erro && (
          <div className="diag-erro">
            {erro}
          </div>
        )}

        {/* CARTÕES DOS BIOMÉTRICOS INTEGRADOS COM SISTEMA DE ALERTAS */}
        <div className="diag-cartoes-grid">
          <CartaoSensor
            titulo="Temperatura"
            valor={leitura ? `${leitura.temperatura.toFixed(1)} °C` : "—"}
            pulsando={pulsando && !mensagemAlertaTemp}
            mensagemAlerta={mensagemAlertaTemp}
            estaCalibrando={!calibrado}
          />
          <CartaoSensor
            titulo="Frequência Cardíaca"
            valor={leitura ? `${leitura.bpm} bpm` : "—"}
            pulsando={pulsando && !mensagemAlertaBpm}
            mensagemAlerta={mensagemAlertaBpm}
            estaCalibrando={!calibrado}
          />
          <CartaoSensor
            titulo="Magnitude (aceleração)"
            valor={leitura ? `${leitura.magnitudeG.toFixed(2)} G` : "—"}
            pulsando={pulsando}
            mensagemAlerta={null}
            estaCalibrando={!calibrado}
          />
        </div>

        {/* Gráfico de Evolução Temporal */}
        <div className="diag-chart-card">
          <div className="diag-chart-header">
            <div className="diag-metric-tabs">
              {METRICAS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetricaAtiva(m.key)}
                  className={`diag-metric-tab ${
                    metricaAtiva === m.key ? "diag-metric-tab-active" : ""
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {historico.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={historico}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hora" tick={{ fontSize: 11 }} minTickGap={20} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  width={40}
                  unit={` ${metrica.unidade}`}
                />
                <Tooltip
                  formatter={(value) => [
                    `${value ?? "—"} ${metrica.unidade}`,
                    metrica.label,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey={metricaAtiva}
                  name={metrica.label}
                  stroke={metrica.cor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="diag-chart-empty">
              A recolher dados suficientes para o gráfico...
            </div>
          )}
        </div>

        <div className="diag-fall-box">
          Estado do sensor de queda:{" "}
          <span className="diag-fall-value">
            {leitura
              ? (FALL_STATE_LABELS[leitura.fallState] ?? "Desconhecido")
              : "—"}
          </span>
        </div>

        {leitura && (
          <p className="diag-last-update">
            Última atualização:{" "}
            {new Date(leitura.atualizadoEm).toLocaleTimeString()}
          </p>
        )}
      </main>


      {mostrarFinalizar && (
        <FinalizarConsultaModal
          idMedico={idMedico}
          deviceId={DEVICE_ID}
          onClose={() => setMostrarFinalizar(false)}
          onFinalizado={onClose}
        />
      )}
    </div>
  );
}

interface CartaoProps {
  titulo: string;
  valor: string;
  pulsando: boolean;
  mensagemAlerta: string | null;
  estaCalibrando: boolean;
}

function CartaoSensor({
  titulo,
  valor,
  pulsando,
  mensagemAlerta,
  estaCalibrando,
}: CartaoProps) {
  const emAlerta = !!mensagemAlerta;

  const estadoClasse = estaCalibrando
    ? "diag-cartao-calibrando"
    : emAlerta
    ? "diag-cartao-alerta pulso-vermelho-ativo"
    : pulsando
    ? "diag-cartao-pulsando pulso-verde-ativo"
    : "diag-cartao-default";

  return (
    <div className={`diag-cartao ${estadoClasse}`}>
      <div className="diag-cartao-inner">
        <div className="diag-cartao-top-row">
          <span
            className={`diag-cartao-titulo ${
              emAlerta ? "diag-cartao-titulo-alerta" : ""
            }`}
          >
            {titulo}
          </span>
          {estaCalibrando && (
            <span className="diag-cartao-calibrando-badge animate-pulse">
              A calibrar...
            </span>
          )}
        </div>
        <span
          className={`diag-cartao-valor ${
            estaCalibrando
              ? "diag-cartao-valor-calibrando"
              : emAlerta
              ? "diag-cartao-valor-alerta"
              : ""
          }`}
        >
          {estaCalibrando ? "—" : valor}
        </span>
      </div>

      {/* Caixa de Mensagem Interna do Cartão - Aparece de forma dinâmica se houver desvio */}
      {emAlerta && !estaCalibrando && (
        <div className="diag-cartao-alerta-msg animate-fade-in">
          <span className="diag-cartao-alerta-icon">Alerta:</span>
          {mensagemAlerta}
        </div>
      )}
    </div>
  );
}
