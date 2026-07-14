import { useState, useEffect } from 'react'
import DiagnosticoLiveView from './DiagnosticoLiveView'

type Passo = 'confirmar' | 'ao_vivo'

export default function DiagnosticoRapidoModal({
  onClose,
  idMedico,
}: {
  onClose: () => void
  idMedico: number
}) {
  const [passo, setPasso] = useState<Passo>('confirmar')
  const [presente, setPresente] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const verificarPresenca = async () => {
      try {
        const res = await fetch('/api/presenca/estado')
        if (!res.ok) return
        const data = await res.json()
        setPresente(data.presente)
      } catch {
        setPresente(false)
      }
    }

    verificarPresenca()
    const interval = setInterval(verificarPresenca, 2000)
    return () => clearInterval(interval)
  }, [])

  // Função disparada ao clicar em "Sim"
  const handleConfirmarInicio = async () => {
    setLoading(true)
    try {
      // Abre a trava no backend para o nó de sinais vitais (ex: "node1")
      const res = await fetch('/api/diagnosticos/node1/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        setPasso('ao_vivo')
      } else {
        console.error("Erro ao ativar o diagnóstico no backend")
        // Como fallback, podes escolher avançar ou travar a UI
        setPasso('ao_vivo') 
      }
    } catch (err) {
      console.error("Erro de rede ao iniciar o diagnóstico:", err)
      setPasso('ao_vivo')
    } finally {
      setLoading(false)
    }
  }

  if (passo === 'ao_vivo') {
    return <DiagnosticoLiveView onClose={onClose} idMedico={idMedico} />
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl cursor-pointer"
          title="Fechar"
          disabled={loading}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Consulta Rápida</h2>

        <div className="flex flex-col gap-6">
          {presente === null && (
            <p className="text-sm text-gray-400">A verificar presença do paciente...</p>
          )}

          {presente === false && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-2xl px-4 py-3 text-sm">
              Não foi detetada a presença de nenhum paciente. Aproxima-te do sensor e aguarda alguns segundos.
            </div>
          )}

          {presente === true && (
            <p className="text-sm text-gray-600">
              {loading ? "A preparar o diagnóstico..." : "Tem a certeza que pretende iniciar uma consulta rápida?"}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Não
            </button>
            <button
              onClick={handleConfirmarInicio}
              disabled={presente !== true || loading}
              className="flex-1 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm"
            >
              {loading ? "A carregar..." : "Sim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}