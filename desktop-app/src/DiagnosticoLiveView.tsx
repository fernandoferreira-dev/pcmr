import { useState, useEffect, useRef } from 'react'
import FinalizarConsultaModal from './FinalizarConsultaModal'

interface LeituraSensor {
  temperatura: number
  bpm: number
  magnitudeG: number
  fallState: number
  alertaQuedaAtivo: boolean
  atualizadoEm: string
}

const POLL_INTERVAL_MS = 2000
const DEVICE_ID = 'wearable01'

const FALL_STATE_LABELS: Record<number, string> = {
  0: 'Repouso',
  1: 'Queda livre detetada',
  2: 'Impacto detetado',
  3: 'A confirmar queda...',
}

export default function DiagnosticoLiveView({
  onClose,
  idMedico,
}: {
  onClose: () => void
  idMedico: number
}) {
  const [leitura, setLeitura] = useState<LeituraSensor | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const buscarLeitura = async () => {
      try {
        const res = await fetch(`/api/sensores/${DEVICE_ID}/ultima-leitura`)
        if (!res.ok) {
          setErro('Sem dados do dispositivo ainda.')
          return
        }
        const data = await res.json()
        setLeitura(data)
        setErro(null)
      } catch {
        setErro('Erro de comunicação com o servidor.')
      }
    }

    buscarLeitura()
    pollingRef.current = setInterval(buscarLeitura, POLL_INTERVAL_MS)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const emQueda = leitura?.alertaQuedaAtivo ?? false

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CartaoSensor
            titulo="Temperatura"
            valor={leitura ? `${leitura.temperatura.toFixed(1)} °C` : '—'}
          />
          <CartaoSensor
            titulo="Frequência Cardíaca"
            valor={leitura ? `${leitura.bpm} bpm` : '—'}
          />
          <CartaoSensor
            titulo="Magnitude (aceleração)"
            valor={leitura ? `${leitura.magnitudeG.toFixed(2)} G` : '—'}
          />
        </div>

        <div className="mt-6 bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600">
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

function CartaoSensor({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{titulo}</span>
      <span className="text-2xl font-bold text-gray-800">{valor}</span>
    </div>
  )
}