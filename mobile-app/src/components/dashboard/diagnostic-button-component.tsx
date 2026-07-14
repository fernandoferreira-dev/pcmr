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

  if (passo === 'ao_vivo') {
    return <DiagnosticoLiveView onClose={onClose} idMedico={idMedico} />
  }

  return (
    <div className="overlay">
      <div className="modal">
        <button
          onClick={onClose}
          className="closeButton"
          title="Fechar"
        >
          ✕
        </button>

        <h2 className="title">Consulta Rápida</h2>

        <div className="content">
          {presente === null && (
            <p className="checkingText">A verificar presença do paciente...</p>
          )}

          {presente === true && (
            <div className="warningBox">
              Não foi detetada a presença de nenhum paciente. Aproxima-te do sensor e aguarda alguns segundos.
            </div>
          )}

          {presente === false && (
            <p className="confirmText">
              Tem a certeza que pretende iniciar uma consulta rápida?
            </p>
          )}

          <div className="buttonRow">
            <button
              onClick={onClose}
              className="noButton"
            >
              Não
            </button>
            <button
              onClick={() => setPasso('ao_vivo')}
              className="yesButton"
            >
              Sim
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}