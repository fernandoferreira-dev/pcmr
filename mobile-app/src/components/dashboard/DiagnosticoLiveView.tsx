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
import "../../styles/dashboard-styles/diagnostic-live-view-styles.css";

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

const LIMITES_ALERTA = {
  tempMaxima: 38.0,
  bpmMinimo: 50,
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
  const alertaTempRegistadoRef = useRef(false);
  const alertaBpmRegistadoRef = useRef(false);
  const inicioSessaoRef = useRef(new Date().toISOString());

  // FUNÇÕES DE REGISTO
  const registarAlertaBD = async (tipo: string, valor: number, mensagem: string) => {
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

        // Verificação de alertas
        if (data.temperatura > LIMITES_ALERTA.tempMaxima) {
          if (!alertaTempRegistadoRef.current) {
            registarAlertaBD(
              'TEMPERATURA_ALTA',
              data.temperatura,
              `Temperatura crítica atingida durante monitorização: ${data.temperatura.toFixed(1)}°C`
            );
            alertaTempRegistadoRef.current = true;
          }
        } else {
          alertaTempRegistadoRef.current = false;
        }

        if (data.bpm > 0 && data.bpm < LIMITES_ALERTA.bpmMinimo) {
          if (!alertaBpmRegistadoRef.current) {
            registarAlertaBD(
              'BPM_BAIXO',
              data.bpm,
              `Frequência cardíaca abaixo do limiar seguro: ${data.bpm} bpm`
            );
            alertaBpmRegistadoRef.current = true;
          }
        } else {
          alertaBpmRegistadoRef.current = false;
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

          // Efeito visual de dados novos recebidos
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

        // Garante que os dados recebidos são uma estrutura de array antes de aplicar no estado
        if (Array.isArray(data)) {
          setAlertas(data);
        }
      } catch {
        // falha silenciosa
      }
    };

    buscarAlertas();
    const interval = setInterval(buscarAlertas, 4000);
    return () => clearInterval(interval);
  }, []);


  // --- ESTADOS DERIVADOS PARA JSX ---
  const emQueda = leitura?.alertaQuedaAtivo ?? false;
  const alertaTemperatura = leitura && leitura.temperatura > LIMITES_ALERTA.tempMaxima;
  const alertaBpm = leitura && leitura.bpm > 0 && leitura.bpm < LIMITES_ALERTA.bpmMinimo;

  const metrica = METRICAS.find((m) => m.key === metricaAtiva)!;

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">
          Consulta Rápida
        </h1>
        <button
          onClick={onClose}
          className="closeButton"
          title="Fechar"
        >
          ✕
        </button>
      </header>

      <main className="main">

        {/* Painel Superior de Alertas Ativos */}
        <div className="alertsContainer">
          {emQueda && (
            <div className={`${"alertaQueda"} ${"animatePulse"}`}>
              ALERTA: Movimento de queda severa detetado no paciente!
            </div>
          )}
          {alertaTemperatura && (
            <div className="alertaTemperatura">
              ALERTA: Hipertermia detetada ({leitura?.temperatura.toFixed(1)} °C). Limite de 38.0°C ultrapassado.
            </div>
          )}
          {alertaBpm && (
            <div className="alertaBpm">
              ALERTA: Bradicardia grave detetada ({leitura?.bpm} bpm). Valor abaixo de 50 bpm.
            </div>
          )}

          {/* Banner de alertas originados na BD */}
          {alertas.length > 0 && (
            <div className="alertasBdWrapper">
              {alertas.map((a, idx) => (
                <div
                  key={idx}
                  className={`${"alertaBdItem"} ${"animateFadeIn"}`}
                >
                  <span className="alertaBdTipo">
                    {a.tipoAlerta ? a.tipoAlerta.replace(/_/g, " ") : "ALERTA"}:
                  </span>{" "}
                  {a.mensagem}
                  {a.dataHora && (
                    <span className="alertaBdHora">
                      ({new Date(a.dataHora).toLocaleTimeString('pt-PT')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {erro && (
          <div className="erroBox">
            {erro}
          </div>
        )}

        {/* Cartões dos Sensores Biométricos */}
        <div className="cardsGrid">
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
        <div className="chartSection">
          <div className="chartHeaderRow">
            <div className="metricToggleGroup">
              {METRICAS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetricaAtiva(m.key)}
                  className={`${"metricButton"} ${metricaAtiva === m.key
                      ? "metricButtonActive"
                      : "metricButtonInactive"
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
            <div className="chartPlaceholder">
              A recolher dados suficientes para o gráfico...
            </div>
          )}
        </div>

        <div className="fallStateBox">
          Estado do sensor de queda:{" "}
          <span className="fallStateValue">
            {leitura
              ? (FALL_STATE_LABELS[leitura.fallState] ?? "Desconhecido")
              : "—"}
          </span>
        </div>

        {leitura && (
          <p className="lastUpdateText">
            Última atualização:{" "}
            {new Date(leitura.atualizadoEm).toLocaleTimeString()}
          </p>
        )}
      </main>

      <footer className="footer">
        <button
          disabled={!leitura}
          onClick={() => setMostrarFinalizar(true)}
          className="finishButton"
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
  const estadoClass = emAlerta
    ? "pulsoVermelhoAtivo"
    : pulsando
      ? `${"cardBgGray"} ${"pulsoVerdeAtivo"}`
      : `${"cardBgGray"} ${"cardBorderTransparent"}`;

  return (
    <div className={`${"card"} ${estadoClass}`}>
      <span
        className={`${"cardLabel"} ${emAlerta ? "cardLabelAlert" : "cardLabelNormal"
          }`}
      >
        {titulo}
      </span>
      <span
        className={`${"cardValue"} ${emAlerta ? "cardValueAlert" : "cardValueNormal"
          }`}
      >
        {valor}
      </span>
    </div>
  );
}