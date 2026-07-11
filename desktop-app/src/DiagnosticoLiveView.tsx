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

interface LeituraSensor {
  temperatura: number;
  bpm: number;
  magnitudeG: number;
  fallState: number;
  alertaQuedaAtivo: boolean;
  atualizadoEm: string;
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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulsoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimaHoraRef = useRef<string | null>(null);

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

          // Animação
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
  }, []);

  const emQueda = leitura?.alertaQuedaAtivo ?? false;
  const metrica = METRICAS.find((m) => m.key === metricaAtiva)!;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <style>{`
        @keyframes pulso-verde {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
            border-color: rgba(34, 197, 94, 0.9);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
            border-color: rgba(34, 197, 94, 0.4);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
            border-color: transparent;
          }
        }
        .pulso-verde-ativo {
          animation: pulso-verde ${DURACAO_PULSO_MS}ms ease-out;
          border: 2px solid transparent;
        }
      `}</style>

      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">
          Consulta Rápida — Dados em Tempo Real
        </h1>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer"
          title="Fechar"
        >
          ✕
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {emQueda && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-700 rounded-2xl px-4 py-3 font-medium">
            Alerta de queda ativo
          </div>
        )}

        {erro && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <CartaoSensor
            titulo="Temperatura"
            valor={leitura ? `${leitura.temperatura.toFixed(1)} °C` : "—"}
            pulsando={pulsando}
          />
          <CartaoSensor
            titulo="Frequência Cardíaca"
            valor={leitura ? `${leitura.bpm} bpm` : "—"}
            pulsando={pulsando}
          />
          <CartaoSensor
            titulo="Magnitude (aceleração)"
            valor={leitura ? `${leitura.magnitudeG.toFixed(2)} G` : "—"}
            pulsando={pulsando}
          />
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-600">
              Evolução — {metrica.label}
            </div>

            <div className="flex gap-1 bg-white rounded-full p-1 border border-gray-200">
              {METRICAS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetricaAtiva(m.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    metricaAtiva === m.key
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
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
              A recolher dados suficientes para o gráfico...
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600">
          Estado do sensor de queda:{" "}
          <span className="font-medium text-gray-800">
            {leitura
              ? (FALL_STATE_LABELS[leitura.fallState] ?? "Desconhecido")
              : "—"}
          </span>
        </div>

        {leitura && (
          <p className="mt-4 text-xs text-gray-400">
            Última atualização:{" "}
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
          Terminar Consulta
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

function CartaoSensor({
  titulo,
  valor,
  pulsando,
}: {
  titulo: string;
  valor: string;
  pulsando: boolean;
}) {
  return (
    <div
      className={`bg-gray-50 rounded-2xl p-4 flex flex-col gap-1 ${
        pulsando ? "pulso-verde-ativo" : "border-2 border-transparent"
      }`}
    >
      <span className="text-xs text-gray-500 uppercase tracking-wide">
        {titulo}
      </span>
      <span className="text-2xl font-bold text-gray-800">{valor}</span>
    </div>
  );
}