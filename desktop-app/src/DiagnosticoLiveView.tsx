import { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import FinalizarConsultaModal from './FinalizarConsultaModal'

interface LeituraSensor {
  temperatura: number
  bpm: number
  magnitudeG: number
  fallState: number
  alertaQuedaAtivo: boolean
  atualizadoEm: string
}

interface PontoGrafico {
  hora: string
  temperatura: number
  bpm: number
  magnitudeG: number
}

type Metrica = 'temperatura' | 'bpm' | 'magnitudeG'

const POLL_INTERVAL_MS = 2000
const DEVICE_ID = 'wearable01'
const MAX_PONTOS_GRAFICO = 60
const PULSE_DURATION_MS = 600

const FALL_STATE_LABELS: Record<number, string> = {
  0: 'Repouso',
  1: 'Queda livre detetada',
  2: 'Impacto detetado',
  3: 'A confirmar queda...',
}

const METRICAS: { chave: Metrica; label: string; cor: string; sufixo: string; formatar: (v: number) => string }[] = [
  { chave: 'temperatura', label: 'Temperatura', cor: '#f97316', sufixo: '°C', formatar: (v) => v.toFixed(1) },
  { chave: 'bpm', label: 'Frequência Cardíaca', cor: '#dc2626', sufixo: 'bpm', formatar: (v) => v.toFixed(0) },
  { chave: 'magnitudeG', label: 'Magnitude', cor: '#2563eb', sufixo: 'G', formatar: (v) => v.toFixed(2) },
]

export default function DiagnosticoLiveView({
  onClose,
  idMedico,
}: {
  onClose: () => void
  idMedico: number
}) {
  const [leitura, setLeitura] = useState<LeituraSensor | null>(null)
  const [historico, setHistorico] = useState<PontoGrafico[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false)
  const [metricaAtiva, setMetricaAtiva] = useState<Metrica>('bpm')
  const [pulsando, setPulsando] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimaHoraRef = useRef<string | null>(null)

  useEffect(() => {
    const buscarLeitura = async () => {
      try {
        const res = await fetch(`/api/sensores/${DEVICE_ID}/ultima-leitura`)
        if (!res.ok) {
          setErro('Sem dados do dispositivo ainda.')
          return
        }
        const data: LeituraSensor = await res.json()
        setLeitura(data)
        setErro(null)

        if (data.atualizadoEm !== ultimaHoraRef.current) {
          ultimaHoraRef.current = data.atualizadoEm

          setPulsando(true)
          if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
          pulseTimeoutRef.current = setTimeout(() => setPulsando(false), PULSE_DURATION_MS)

          const novoPonto: PontoGrafico = {
            hora: new Date(data.atualizadoEm).toLocaleTimeString(),
            temperatura: data.temperatura,
            bpm: data.bpm,
            magnitudeG: data.magnitudeG,
          }

          setHistorico((prev) => {
            const atualizado = [...prev, novoPonto]
            return atualizado.length > MAX_PONTOS_GRAFICO
              ? atualizado.slice(atualizado.length - MAX_PONTOS_GRAFICO)
              : atualizado
          })
        }
      } catch {
        setErro('Erro de comunicação com o servidor.')
      }
    }

    buscarLeitura()
    pollingRef.current = setInterval(buscarLeitura, POLL_INTERVAL_MS)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    }
  }, [])

  const emQueda = leitura?.alertaQuedaAtivo ?? false
  const metricaInfo = METRICAS.find((m) => m.chave === metricaAtiva)!

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <style>{`
        @keyframes pulsar-verde {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        .pulsar-verde {
          animation: pulsar-verde ${PULSE_DURATION_MS}ms ease-out;
        }
      `}</style>

      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Consulta Rápida — Dados em Tempo Real</h1>
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
            valor={leitura ? `${leitura.temperatura.toFixed(1)} °C` : '—'}
            pulsando={pulsando}
          />
          <CartaoSensor
            titulo="Frequência Cardíaca"
            valor={leitura ? `${leitura.bpm} bpm` : '—'}
            pulsando={pulsando}
          />
          <CartaoSensor
            titulo="Magnitude (aceleração)"
            valor={leitura ? `${leitura.magnitudeG.toFixed(2)} G` : '—'}
            pulsando={pulsando}
          />
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-600">
              Evolução — {metricaInfo.label}
            </div>

            <div className="flex gap-1 bg-white rounded-full border border-gray-200 p-1">
              {METRICAS.map((m) => (
                <button
                  key={m.chave}
                  onClick={() => setMetricaAtiva(m.chave)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    metricaAtiva === m.chave
                      ? 'text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  style={metricaAtiva === m.chave ? { backgroundColor: m.cor } : undefined}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {historico.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hora" tick={{ fontSize: 11 }} minTickGap={20} />
                <YAxis tick={{ fontSize: 11 }} width={45} unit={` ${metricaInfo.sufixo}`} />
                <Tooltip 
                  formatter={(value) => [
                    `${metricaInfo.formatar(Number(value))} ${metricaInfo.sufixo}`, 
                    metricaInfo.label
                  ]} 
                />
                <Line
                  type="monotone"
                  dataKey={metricaAtiva}
                  name={metricaInfo.label}
                  stroke={metricaInfo.cor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
              A recolher dados suficientes para o gráfico...
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600">
          Estado do sensor de queda:{' '}
          <span className="font-medium text-gray-800">
            {leitura ? FALL_STATE_LABELS[leitura.fallState] ?? 'Desconhecido' : '—'}
          </span>
        </div>

        {leitura && (
          <p className="mt-4 text-xs text-gray-400">
            Última atualização: {new Date(leitura.atualizadoEm).toLocaleTimeString()}
          </p>
        )}
      </main>

      <footer className="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          disabled={!leitura}
          onClick={() => setMostrarFinalizar(true)}
          className="px-6 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm"
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
  )
}

function CartaoSensor({
  titulo,
  valor,
  pulsando,
}: {
  titulo: string
  valor: string
  pulsando: boolean
}) {
  return (
    <div
      className={`bg-gray-50 rounded-2xl p-4 flex flex-col gap-1 ${pulsando ? 'pulsar-verde' : ''}`}
    >
      <span className="text-xs text-gray-500 uppercase tracking-wide">{titulo}</span>
      <span className="text-2xl font-bold text-gray-800">{valor}</span>
    </div>
  )
}