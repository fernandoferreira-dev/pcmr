import { useState, useEffect } from 'react'
import DiagnosticoLiveView from './DiagnosticoLiveView'
import '../../styles/dashboard-styles/quick-diagnostic-styles.css'

type Passo = 'confirmar' | 'ao_vivo'

export default function DiagnosticButtonComponent({
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

  const handleConfirmarInicio = async () => {
    setLoading(true)
    try {
      // Ativa o diagnóstico no backend
      const res = await fetch('/api/diagnosticos/wearable01/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        console.log("Diagnóstico ativado com sucesso")
        setPasso('ao_vivo')
      } else {
        console.error("Erro ao ativar diagnóstico")
        setPasso('ao_vivo') // fallback
      }
    } catch (err) {
      console.error("Erro de rede:", err)
      setPasso('ao_vivo') // fallback
    } finally {
      setLoading(false)
    }
  }

  if (passo === 'ao_vivo') {
    return <DiagnosticoLiveView onClose={onClose} idMedico={idMedico} />
  }

  return (
    <div className="overlay">
      <div className="modal">
        <button onClick={onClose} className="closeButton" title="Fechar" disabled={loading}>
          ✕
        </button>

        <h2 className="title">Consulta Rápida</h2>

        <div className="content">
          {presente === null && <p className="checkingText">A verificar presença...</p>}

          {presente === false && (
            <div className="warningBox">
              Não foi detetada a presença de nenhum paciente. Aproxima-te do sensor.
            </div>
          )}

          {presente === true && (
            <p className="confirmText">
              Tem a certeza que pretende iniciar uma consulta rápida?
            </p>
          )}

          <div className="buttonRow">
            <button onClick={onClose} className="noButton" disabled={loading}>
              Não
            </button>
            <button
              onClick={handleConfirmarInicio}
              //disabled={presente !== true || loading}
              disabled={loading}
              className="yesButton"
            >
              {loading ? "A ativar..." : "Sim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}