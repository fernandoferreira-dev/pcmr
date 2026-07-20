import { useState, useEffect, useRef } from 'react'

interface EstadoPresenca {
  presente: boolean
  atualizadoEm: string
}

const POLL_INTERVAL_MS = 3000
const DURACAO_TOAST_MS = 6000

export default function PresencaToast() {
  const [mostrar, setMostrar] = useState(false)
  const presenteAnteriorRef = useRef<boolean | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const verificarPresenca = async () => {
      try {
        const res = await fetch('/api/presenca/estado')
        if (!res.ok) return
        const data: EstadoPresenca = await res.json()

        // Só dispara o popup na transição false/null -> true, não em
        // todas as leituras "presente" repetidas.
        if (data.presente && presenteAnteriorRef.current === false) {
          setMostrar(true)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => setMostrar(false), DURACAO_TOAST_MS)
        }

        presenteAnteriorRef.current = data.presente
      } catch {
        // falha silenciosa; não interrompe o polling seguinte
      }
    }

    verificarPresenca()
    const interval = setInterval(verificarPresenca, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!mostrar) return null

  return (
    <div className="fixed top-6 right-6 z-[100] animate-[fadeIn_0.3s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex items-center gap-3 bg-white border border-green-300 rounded-2xl shadow-lg px-5 py-4 max-w-sm">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Paciente detetado</p>
          <p className="text-xs text-gray-500">Presença confirmada no sensor de proximidade.</p>
        </div>
        <button
          onClick={() => {
            setMostrar(false)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
          }}
          className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
          title="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}