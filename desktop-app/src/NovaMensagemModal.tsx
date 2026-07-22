import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface UtilizadorResumo {
  idUtilizador: number
  nome: string
  email: string
  tipoUtilizador: string
}

export default function NovaMensagemModal({
  idRemetente,
  onClose,
  onEnviada,
}: {
  idRemetente: number
  onClose: () => void
  onEnviada: () => void
}) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<UtilizadorResumo[]>([])
  const [destinatario, setDestinatario] = useState<UtilizadorResumo | null>(null)
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { t } = useTranslation();

  const procurar = useCallback(async (nome: string) => {
    if (!nome.trim()) {
      setResultados([])
      return
    }
    try {
      const res = await fetch(
        `/api/mensagens/utilizadores/procurar?nome=${encodeURIComponent(nome)}&excluirId=${idRemetente}`
      )
      if (!res.ok) return
      const data: UtilizadorResumo[] = await res.json()
      setResultados(data)
    } catch {

    }
  }, [idRemetente])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => procurar(termo), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [termo, procurar])

  const podeEnviar = destinatario !== null && assunto.trim() !== ''

  const enviar = async () => {
    setAEnviar(true)
    setErro(null)

    try {
      const res = await fetch('/api/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idRemetente,
          idDestinatario: destinatario?.idUtilizador,
          assunto,
          corpo,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        onEnviada()
      } else {
        setErro(data.erro || 'Erro ao enviar a mensagem.')
      }
    } catch {
      setErro('Erro de comunicação com o servidor.')
    } finally {
      setAEnviar(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl cursor-pointer"
          title={t('novaMensagemModal.messageClose')}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('novaMensagemModal.messageNew')}</h2>

        {!destinatario ? (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder={t('novaMensagemModal.messageSearchRecipient')}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm cursor-text"
            />

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
              {resultados.map((u) => (
                <button
                  key={u.idUtilizador}
                  onClick={() => setDestinatario(u)}
                  className="text-left px-3 py-2 rounded-xl text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                >
                  <div className="font-medium">{u.nome} <span className="text-xs text-gray-400">({u.tipoUtilizador})</span></div>
                  <div className="text-xs opacity-80">{u.email}</div>
                </button>
              ))}
              {resultados.length === 0 && termo.trim() !== '' && (
                <p className="text-xs text-gray-400 px-1">{t('novaMensagemModal.messageNoUsersFound')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <div>
                <div className="text-sm font-medium text-gray-800">{destinatario.nome}</div>
                <div className="text-xs text-gray-500">{destinatario.email}</div>
              </div>
              <button
                onClick={() => setDestinatario(null)}
                className="text-xs text-gray-400 hover:text-gray-700 underline cursor-pointer"
              >
                {t('novaMensagemModal.messageChangeRecipient')}
              </button>
            </div>

            <input
              type="text"
              placeholder={t('novaMensagemModal.messageSubject')}
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm cursor-text"
            />

            <textarea
              placeholder={t('novaMensagemModal.messageBody')}
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={5}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none cursor-text"
            />
          </div>
        )}

        {erro && <p className="text-sm text-red-600 mt-3">{erro}</p>}

        <button
          disabled={!podeEnviar || aEnviar}
          onClick={enviar}
          className="w-full mt-4 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm"
        >
          {aEnviar ? t('novaMensagemModal.messageSending') : t('novaMensagemModal.messageSend')}
        </button>
      </div>
    </div>
  )
}