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

interface AlertaSessao {
  tipoAlerta: string;
  mensagem: string;
  dataHora: string;
}

type MetricaKey = "temperatura" | "bpm" | "magnitudeG";

const POLL_INTERVAL_MS = 2000;
const DEVICE_ID = "wearable01";
const MAX_PONTOS_GRAFICO = 60; // últimos 2 minutos de histórico (60 * 2s)
const DURACAO_PULSO_MS = 700;

// LIMITES ATUALIZADOS E SINCRONIZADOS COM O SEU BACKEND
const LIMITES_ALERTA = {
  tempMinima: 35.0,
  tempMaxima: 38.0,
  bpmMinimo: 60,
  bpmMaximo: 100,
};

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
  const [alertas, setAlertas] = useState<AlertaSessao[]>([]);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulsoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimaHoraRef = useRef<string | null>(null);

  // Refs de registo individual para os 4 tipos de limites
  const alertaTempAltaRegistadoRef = useRef(false);
  const alertaTempBaixaRegistadoRef = useRef(false);
  const alertaBpmAltoRegistadoRef = useRef(false);
  const alertaBpmBaixoRegistadoRef = useRef(false);
  
  // Compensar clock skew do servidor
  const inicioSessaoRef = useRef(new Date(Date.now() - 60000).toISOString());

  // FUNÇÕES DE REGISTO
  const registarAlertaBD = async (tipo: string, valor: number, mensagem: string) => {
    // Atualização Otimista imediata no ecrã
    const novoAlerta: AlertaSessao = {
      tipoAlerta: tipo,
      mensagem: mensagem,
      dataHora: new Date().toISOString(),
    };
    
    setAlertas((prev) => [novoAlerta, ...prev]);

    try {
      await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idMedico,
          deviceId: DEVICE_ID,
          tipoAlerta: tipo,
          valorRegistado: valor,
          mensagem: mensagem
        })
      });
    } catch (e) {
      console.error("Erro ao submeter o alerta para a Base de Dados:", e);
    }
  };

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

        // --- SISTEMA DE VERIFICAÇÃO MULTI-LIMITE ---
        
        // 1. Temperatura Máxima
        if (data.temperatura > LIMITES_ALERTA.tempMaxima) {
          if (!alertaTempAltaRegistadoRef.current) {
            registarAlertaBD(
              'TEMPERATURA_ALTA', 
              data.temperatura, 
              `Temperatura crítica atingida: ${data.temperatura.toFixed(1)}°C excede o limite de ${LIMITES_ALERTA.tempMaxima.toFixed(1)}°C`
            );
            alertaTempAltaRegistadoRef.current = true;
          }
        } else {
          alertaTempAltaRegistadoRef.current = false;
        }

        // 2. Temperatura Mínima
        if (data.temperatura < LIMITES_ALERTA.tempMinima) {
          if (!alertaTempBaixaRegistadoRef.current) {
            registarAlertaBD(
              'TEMPERATURA_BAIXA', 
              data.temperatura, 
              `Temperatura de ${data.temperatura.toFixed(1)}°C está abaixo do limite mínimo de ${LIMITES_ALERTA.tempMinima.toFixed(1)}°C`
            );
            alertaTempBaixaRegistadoRef.current = true;
          }
        } else {
          alertaTempBaixaRegistadoRef.current = false;
        }

        // 3. Frequência Cardíaca Máxima
        if (data.bpm > LIMITES_ALERTA.bpmMaximo) {
          if (!alertaBpmAltoRegistadoRef.current) {
            registarAlertaBD(
              'BPM_ALTO', 
              data.bpm, 
              `Frequência cardíaca de ${data.bpm} bpm excede o limite máximo de ${LIMITES_ALERTA.bpmMaximo} bpm`
            );
            alertaBpmAltoRegistadoRef.current = true;
          }
        } else {
          alertaBpmAltoRegistadoRef.current = false;
        }

        // 4. Frequência Cardíaca Mínima
        if (data.bpm > 0 && data.bpm < LIMITES_ALERTA.bpmMinimo) {
          if (!alertaBpmBaixoRegistadoRef.current) {
            registarAlertaBD(
              'BPM_BAIXO', 
              data.bpm, 
              `Frequência cardíaca de ${data.bpm} bpm está abaixo do limite mínimo de ${LIMITES_ALERTA.bpmMinimo} bpm`
            );
            alertaBpmBaixoRegistadoRef.current = true;
          }
        } else {
          alertaBpmBaixoRegistadoRef.current = false;
        }


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

  useEffect(() => {
    const buscarAlertas = async () => {
      try {
        const res = await fetch(`/api/alertas?deviceId=${DEVICE_ID}&desde=${inicioSessaoRef.current}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setAlertas((prev) => {
            return data.length > 0 ? data : prev; 
          });
        }
      } catch {
        // falha silenciosa
      }
    };

    buscarAlertas();
    const interval = setInterval(buscarAlertas, 4000);
    return () => clearInterval(interval);
  }, []);

  const removerAlertaVisual = (index: number) => {
    setAlertas((prev) => prev.filter((_, idx) => idx !== index));
  };

  // --- ESTADOS DERIVADOS ATUALIZADOS PARA ADVALORAR FRIO/CALOR/BPM ALTO ---
  const emQueda = leitura?.alertaQuedaAtivo ?? false;
  const alertaTemperatura = leitura && (leitura.temperatura > LIMITES_ALERTA.tempMaxima || leitura.temperatura < LIMITES_ALERTA.tempMinima);
  const alertaBpm = leitura && leitura.bpm > 0 && (leitura.bpm < LIMITES_ALERTA.bpmMinimo || leitura.bpm > LIMITES_ALERTA.bpmMaximo);

  const metrica = METRICAS.find((m) => m.key === metricaAtiva)!;

  // Decide se há alertas ativos a ocupar o lado direito
  const temAlertasNoEcra = alertas.length > 0 || emQueda;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <style>{`
        @keyframes pulso-verde {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); border-color: rgba(34, 197, 94, 0.9); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); border-color: rgba(34, 197, 94, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); border-color: transparent; }
        }
        @keyframes pulso-vermelho {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); border-color: rgba(239, 68, 68, 0.9); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: transparent; }
        }
        @keyframes slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .pulso-verde-ativo { animation: pulso-verde ${DURACAO_PULSO_MS}ms ease-out; border: 2px solid transparent; }
        .pulso-vermelho-ativo { animation: pulso-vermelho 1500ms infinite ease-out; border: 2px solid #ef4444; background-color: #fef2f2; }
        .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* PAINEL FIXO DE POPUPS (LADO DIREITO) */}
      <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 w-80 sm:w-96 max-h-[80vh] overflow-y-auto pointer-events-none p-2">
        {emQueda && (
          <div className="pointer-events-auto bg-red-600 text-white rounded-2xl p-4 shadow-2xl border border-red-500 flex justify-between items-start gap-3 animate-slide-in">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="font-bold text-xs uppercase tracking-wider">CRÍTICO</span>
              </div>
              <p className="text-sm mt-1 font-semibold">Queda severa detetada no paciente!</p>
            </div>
          </div>
        )}

        {alertas.map((a, idx) => (
          <div
            key={idx}
            className="pointer-events-auto bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex justify-between items-start gap-3 animate-slide-in"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-wider text-red-400">
                  {a.tipoAlerta ? a.tipoAlerta.replace(/_/g, " ") : "ALERTA"}
                </span>
              </div>
              <p className="text-sm mt-1 text-slate-100 font-medium">{a.mensagem}</p>
              {a.dataHora && (
                <span className="text-[10px] text-slate-400 block mt-2">
                  {new Date(a.dataHora).toLocaleTimeString('pt-PT')}
                </span>
              )}
            </div>
            <button
              onClick={() => removerAlertaVisual(idx)}
              className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer transition-colors p-1"
              title="Fechar Alerta"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

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

      {/* A MÁGICA ACONTECE AQUI: 
        Se houver alertas ativos, o painel encolhe no desktop (xl:pr-[416px]) de forma suave para nada ser tapado. 
      */}
      <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${temAlertasNoEcra ? "xl:pr-[416px]" : ""}`}>
        {erro && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        {/* Cartões dos Sensores Biométricos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <CartaoSensor
            titulo="Temperatura"
            valor={leitura ? `${leitura.temperatura.toFixed(1)} °C` : "—"}
            pulsando={pulsando && !alertaTemperatura}
            emAlerta={alertaTemperatura ?? false}
          />
          <CartaoSensor
            titulo="Frequência Cardíaca"
            valor={leitura ? `${leitura.bpm} bpm` : "—"}
            pulsando={pulsando && !alertaBpm}
            emAlerta={alertaBpm ?? false}
          />
          <CartaoSensor
            titulo="Magnitude (aceleração)"
            valor={leitura ? `${leitura.magnitudeG.toFixed(2)} G` : "—"}
            pulsando={pulsando}
            emAlerta={false}
          />
        </div>

        {/* Gráfico de Evolução Temporal */}
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
  emAlerta,
}: {
  titulo: string;
  valor: string;
  pulsando: boolean;
  emAlerta: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300 ${
        emAlerta 
        ? "pulso-vermelho-ativo" 
        : pulsando 
          ? "bg-gray-50 pulso-verde-ativo" 
          : "bg-gray-50 border-2 border-transparent"
      }`}
    >
      <span className={`text-xs uppercase tracking-wide transition-colors ${emAlerta ? "text-red-700 font-bold" : "text-gray-500"}`}>
        {titulo}
      </span>
      <span className={`text-2xl font-bold transition-colors ${emAlerta ? "text-red-700" : "text-gray-800"}`}>
        {valor}
      </span>
    </div>
  );
}