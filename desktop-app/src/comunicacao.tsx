import { useState, useEffect, useCallback, useRef } from 'react'
import NovaMensagemModal from './NovaMensagemModal'

const maoIcon = new URL('./assets/imagens/maozedong.png', import.meta.url).href

interface Mensagem {
  idMensagem: number
  idRemetente: number
  nomeRemetente: string
  emailRemetente: string
  idDestinatario: number
  nomeDestinatario: string
  emailDestinatario: string
  assunto: string
  corpo: string | null
  dataEnvio: string
  lida: boolean
}

type Vista = 'recebidas' | 'enviadas'

function formatarDataHora(iso: string): string {
  const data = new Date(iso)
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Comunicacao({ userId }: { userId: number }) {
  const [vista, setVista] = useState<Vista>('recebidas')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [pesquisa, setPesquisa] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarNovaMensagem, setMostrarNovaMensagem] = useState(false)
  const [mensagemExpandida, setMensagemExpandida] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregarMensagens = useCallback(async (termo: string, vistaAtual: Vista) => {
    try {
      const endpoint = vistaAtual === 'recebidas' ? 'recebidas' : 'enviadas'
      const url = `/api/mensagens/${endpoint}?userId=${userId}${termo ? `&pesquisa=${encodeURIComponent(termo)}` : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        setErro('Não foi possível carregar as mensagens.')
        return
      }
      const data: Mensagem[] = await res.json()
      setMensagens(data)
      setErro(null)
    } catch {
      setErro('Erro de comunicação com o servidor.')
    }
  }, [userId])

  useEffect(() => {
    setMensagemExpandida(null)
    carregarMensagens(pesquisa, vista)
    // Muda de vista deve recarregar imediatamente, sem esperar pelo debounce da pesquisa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      carregarMensagens(pesquisa, vista)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [pesquisa, vista, carregarMensagens])

  const abrirMensagem = async (mensagem: Mensagem) => {
    setMensagemExpandida(mensagemExpandida === mensagem.idMensagem ? null : mensagem.idMensagem)

    // Só faz sentido marcar como lida do lado de quem recebeu — o backend
    // rejeita (403) se o remetente tentar marcar uma mensagem enviada.
    if (vista === 'recebidas' && !mensagem.lida) {
      try {
        await fetch(`/api/mensagens/${mensagem.idMensagem}/lida?userId=${userId}`, {
          method: 'PATCH',
        })
        setMensagens((prev) =>
          prev.map((m) => (m.idMensagem === mensagem.idMensagem ? { ...m, lida: true } : m))
        )
      } catch {
        // falha silenciosa; o estado local não muda, o utilizador pode tentar reabrir
      }
    }
  }

  const apagarMensagem = async (idMensagem: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/mensagens/${idMensagem}?userId=${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMensagens((prev) => prev.filter((m) => m.idMensagem !== idMensagem))
      }
    } catch {
      // falha silenciosa
    }
  }

  return (
    <div className="relative flex flex-col w-full h-full p-6 bg-[#EBEBEB] rounded-4xl shadow-inner">
      {/* Alternador Recebidas / Enviadas */}
      <div className="flex gap-2 mb-4 shrink-0">
        <button
          onClick={() => setVista('recebidas')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            vista === 'recebidas'
              ? 'bg-[#AAB99F] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Recebidas
        </button>
        <button
          onClick={() => setVista('enviadas')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            vista === 'enviadas'
              ? 'bg-[#AAB99F] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Enviadas
        </button>
      </div>

      {/* Pesquisa */}
      <div className="relative mb-4 shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder={vista === 'recebidas' ? 'Pesquisar por remetente...' : 'Pesquisar por destinatário...'}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#AAB99F] cursor-text"
        />
      </div>

      {erro && (
        <div className="mb-4 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-2xl px-4 py-3 text-sm shrink-0">
          {erro}
        </div>
      )}

      {/* Lista de mensagens */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
        {mensagens.length === 0 && !erro && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            {vista === 'recebidas' ? 'Sem mensagens recebidas.' : 'Sem mensagens enviadas.'}
          </div>
        )}

        {mensagens.map((m) => {
          const nomeContacto = vista === 'recebidas' ? m.nomeRemetente : m.nomeDestinatario
          const rotuloContacto = vista === 'recebidas' ? 'De' : 'Para'

          return (
            <div
              key={m.idMensagem}
              onClick={() => abrirMensagem(m)}
              className="rounded-2xl border border-gray-300 overflow-hidden shadow-sm cursor-pointer bg-white"
            >
              <div className="flex items-center justify-between bg-[#AAB99F] px-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={maoIcon}
                    alt={nomeContacto}
                    className="w-9 h-9 rounded-full bg-white object-cover shrink-0"
                  />
                  <span className="font-bold text-gray-800">
                    {rotuloContacto}: {nomeContacto}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{formatarDataHora(m.dataEnvio)}</span>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600 truncate pr-4">
                  Assunto: {m.assunto}
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  {vista === 'recebidas' && (
                    <button
                      onClick={(e) => apagarMensagem(m.idMensagem, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Apagar mensagem"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${m.lida ? 'bg-green-500' : 'bg-red-500'}`}
                    title={
                      vista === 'recebidas'
                        ? (m.lida ? 'Lida' : 'Não lida')
                        : (m.lida ? 'Lida pelo destinatário' : 'Ainda não lida pelo destinatário')
                    }
                  />
                </div>
              </div>

              {mensagemExpandida === m.idMensagem && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                  {m.corpo || 'Sem conteúdo.'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Botão flutuante de nova mensagem */}
      <button
        onClick={() => setMostrarNovaMensagem(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white border border-gray-300 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
        title="Nova mensagem"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5c6b56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      </button>

      {mostrarNovaMensagem && (
        <NovaMensagemModal
          idRemetente={userId}
          onClose={() => setMostrarNovaMensagem(false)}
          onEnviada={() => {
            setMostrarNovaMensagem(false)
            // Se estiver na vista "enviadas", mostra a mensagem que acabou de mandar
            setVista('enviadas')
            carregarMensagens(pesquisa, 'enviadas')
          }}
        />
      )}
    </div>
  )
}