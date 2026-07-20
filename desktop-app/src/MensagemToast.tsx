import { useState, useEffect, useRef } from 'react'

interface Mensagem {
  idMensagem: number
  nomeRemetente: string
  assunto: string
  dataEnvio: string
  lida: boolean
}

const POLL_INTERVAL_MS = 5000
const DURACAO_TOAST_MS = 6000

export default function MensagemToast({ userId, onAbrirMensagem }: { userId: number; onAbrirMensagem: (idMensagem: number) => void }) {
  const [mensagemAtual, setMensagemAtual] = useState<Mensagem | null>(null)
  const [mostrar, setMostrar] = useState(false)
  
  const idsNotificadosRef = useRef<Set<number>>(new Set())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const verificarNovasMensagens = async () => {
      try {
        const res = await fetch(`/api/mensagens/recebidas?userId=${userId}`)
        if (!res.ok) return
        const mensagens: Mensagem[] = await res.json()

        if (idsNotificadosRef.current.size === 0) {
          mensagens.forEach((m) => idsNotificadosRef.current.add(m.idMensagem))
          return
        }

        const novaMensagem = mensagens.find(
          (m) => !m.lida && !idsNotificadosRef.current.has(m.idMensagem)
        )

        if (novaMensagem) {
          idsNotificadosRef.current.add(novaMensagem.idMensagem)
          setMensagemAtual(novaMensagem)
          setMostrar(true)

          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => setMostrar(false), DURACAO_TOAST_MS)
        }
      } catch {
        // falha silenciosa no polling
      }
    }

    verificarNovasMensagens()
    const interval = setInterval(verificarNovasMensagens, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [userId])

  if (!mostrar || !mensagemAtual) return null

  return (
    <div className="fixed top-20 right-6 z-[100] animate-[fadeIn_0.3s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div 
        onClick={() => {
          setMostrar(false)
          onAbrirMensagem(mensagemAtual.idMensagem)
        }}
        className="flex items-center gap-3 bg-white border border-[#AAB99F] rounded-2xl shadow-lg px-5 py-4 max-w-sm cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-[#AAB99F]/20 flex items-center justify-center shrink-0 text-[#5c6b56]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">Nova mensagem de {mensagemAtual.nomeRemetente}</p>
          <p className="text-xs text-gray-500 truncate">{mensagemAtual.assunto}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
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