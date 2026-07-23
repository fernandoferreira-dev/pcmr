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
import FinalizarConsultaModal from "./FinalizarConsultaModal";
import { useTranslation } from "react-i18next";

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

  const { t } = useTranslation();

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

  // O backend já calcula o estado (com base na configuração guardada na BD);
  // o frontend só decide se mostra a mensagem (não mostra durante a calibração).
  const mensagemAlertaTemp =
    calibrado && leitura?.alertaTemperatura && leitura.alertaTemperatura.estado !== "NORMAL"
      ? leitura.alertaTemperatura.mensagem
      : null;

  const mensagemAlertaBpm =
    calibrado && leitura?.alertaBpm && leitura.alertaBpm.estado !== "NORMAL"
      ? leitura.alertaBpm.mensagem
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <style>{`
    @keyframes pulso-verde {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); border-color: rgba(34, 197, 94, 0.9); }
      70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); border-color: rgba(34, 197, 94, 0.4); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); border-color: transparent; }
    }
    @keyframes pulso-vermelho {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); border-color: rgba(239, 68, 68, 0.8); }
      70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 0.3); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: transparent; }
    }
    .pulso-verde-ativo { animation: pulso-verde ${DURACAO_PULSO_MS}ms ease-out; border: 2px solid transparent; }
    .pulso-vermelho-ativo { animation: pulso-vermelho 1800ms infinite ease-in-out; border: 2px solid #ef4444; }
  `}</style>

      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">
          {t('diagLiveView.diagLiveTitle')}
        </h1>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer"
          title={t('diagLiveView.diagLiveClose')}
        >
          ✕
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {erro && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        {/* CARTÕES DOS BIOMÉTRICOS INTEGRADOS COM SISTEMA DE ALERTAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <CartaoSensor
            titulo={t('diagLiveView.diagLiveTemperature')}
            valor={leitura ? `${leitura.temperatura.toFixed(1)} °C` : t('diagLiveView.diagLiveNoData')}
            pulsando={pulsando && !mensagemAlertaTemp}
            mensagemAlerta={mensagemAlertaTemp}
            estaCalibrando={!calibrado}
          />
          <CartaoSensor
            titulo={t('diagLiveView.diagLiveHeartRate')}
            valor={leitura ? `${leitura.bpm} bpm` : t('diagLiveView.diagLiveNoData')}
            pulsando={pulsando && !mensagemAlertaBpm}
            mensagemAlerta={mensagemAlertaBpm}
            estaCalibrando={!calibrado}
          />
          <CartaoSensor
            titulo={t('diagLiveView.diagLiveAcceleration')}
            valor={leitura ? `${leitura.magnitudeG.toFixed(2)} G` : t('diagLiveView.diagLiveNoData')}
            pulsando={pulsando}
            mensagemAlerta={null}
            estaCalibrando={!calibrado}
          />
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-600">
              {t('diagLiveView.diagLiveEvolution')} {metrica.label}
            </div>

            <div className="flex gap-1 bg-white rounded-full p-1 border border-gray-200">
              {METRICAS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetricaAtiva(m.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${metricaAtiva === m.key
                    ? "bg-[#AAB99F] text-white"
                    : "text-gray-500 hover:bg-gray-100"
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
                    `${value ?? t('diagLiveView.diagLiveNoData')} ${metrica.unidade}`,
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
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
              {t('diagLiveView.diagLiveCollectingData')}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600">
          {t('diagLiveView.diagLiveFallSensorStatus')}{" "}
          <span className="font-medium text-gray-800">
            {leitura
              ? (FALL_STATE_LABELS[leitura.fallState] ?? t('diagLiveView.diagLiveUnknown'))
              : t('diagLiveView.diagLiveNoData')}
          </span>
        </div>

        {leitura && (
          <p className="mt-4 text-xs text-gray-400">
            {t('diagLiveView.diagLiveLastUpdate')}{" "}
            {new Date(leitura.atualizadoEm).toLocaleTimeString()}
          </p>
        )}
      </main>

      <footer className="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          disabled={!leitura}
          onClick={() => setMostrarFinalizar(true)}
          className="px-6 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm"
        >
          {t('diagLiveView.diagLiveFinishConsultation')}
        </button>
      </footer>

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
  const {t} = useTranslation();
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 min-h-[120px] justify-between ${estaCalibrando
          ? "bg-gray-100/70 border-2 border-dashed border-gray-300"
          : emAlerta
            ? "bg-red-50 pulso-vermelho-ativo border-2"
            : pulsando
              ? "bg-gray-50 pulso-verde-ativo border-2"
              : "bg-gray-50 border-2 border-transparent"
        }`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs uppercase tracking-wide font-semibold ${emAlerta ? "text-red-700" : "text-gray-500"}`}>
            {titulo}
          </span>
          {estaCalibrando && (
            <span className="text-[10px] text-gray-400 font-medium animate-pulse bg-gray-200 px-2 py-0.5 rounded-full">
              {t('diagLiveView.diagLiveCalibrating')}
            </span>
          )}
        </div>
        <span className={`text-3xl font-bold ${estaCalibrando ? "text-gray-400" : emAlerta ? "text-red-600" : "text-gray-800"}`}>
          {estaCalibrando ? t('diagLiveView.diagLiveNoData') : valor}
        </span>
      </div>

      {emAlerta && !estaCalibrando && (
        <div className="text-xs text-red-700 bg-red-100/60 border border-red-200 rounded-lg p-2 font-medium leading-relaxed mt-1 animate-fade-in">
          <span className="font-bold mr-1">{t('diagLiveView.diagLiveAlert')}</span>
          {mensagemAlerta}
        </div>
      )}
    </div>
  );
}