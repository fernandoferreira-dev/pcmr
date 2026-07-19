import { useState, useEffect, useRef } from 'react'
import '../../styles/misc/presenca-toast-styles.css'

interface EstadoPresenca {
  presente: boolean
  atualizadoEm: string
}

const POLL_INTERVAL_MS = 3000
const DURACAO_TOAST_MS = 6000

export default function PresencaToastComponent() {
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
    <div className="toast-container">
      <div className="toast-card">
        <div className="toast-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className="toast-content">
          <p className="toast-title">Paciente detetado</p>
          <p className="toast-subtitle">Presença confirmada no sensor de proximidade.</p>
        </div>
        <button
          onClick={() => {
            setMostrar(false)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
          }}
          className="toast-close"
          title="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}