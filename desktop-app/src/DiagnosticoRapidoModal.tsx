import { useState } from 'react'
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
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Consulta Rápida</h2>

        <div className="flex flex-col gap-6">
          <p className="text-sm text-gray-600">
            Tem a certeza que pretende iniciar uma consulta rápida?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-medium transition-colors"
            >
              Não
            </button>
            <button
              onClick={() => setPasso('ao_vivo')}
              className="flex-1 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] rounded-full text-white font-medium transition-colors shadow-sm"
            >
              Sim
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}