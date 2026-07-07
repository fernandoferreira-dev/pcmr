import { useState, useEffect } from 'react'

interface PerfilUtilizador {
  username: string
  nome: string
  email: string
  telemovel: string | null
  dataNascimento: string | null
  tipoUtilizador: string
}

const InfoRow = ({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0">
    <div className="w-12 h-12 rounded-full bg-[#AAB99F] flex items-center justify-center shrink-0 shadow-sm text-white">
      {icon}
    </div>
    <div className="flex flex-col flex-1 min-w-0">
      <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  </div>
)

function formatarData(dataISO: string | null): string {
  if (!dataISO) return 'Não definida'
  const data = new Date(dataISO)
  return data.toLocaleDateString('pt-PT')
}

export default function DadosPessoais({ userId }: { userId: number }) {
  const [perfil, setPerfil] = useState<PerfilUtilizador | null>(null)
  const [editForm, setEditForm] = useState<PerfilUtilizador | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const res = await fetch(`/api/utilizadores/${userId}/perfil`)
        if (!res.ok) {
          setErro('Não foi possível carregar os dados pessoais.')
          return
        }
        const data: PerfilUtilizador = await res.json()
        setPerfil(data)
        setErro(null)
      } catch {
        setErro('Erro de comunicação com o servidor.')
      }
    }

    if (userId > 0) {
      carregarPerfil()
    } else {
      setErro('Utilizador de teste sem perfil associado.')
    }
  }, [userId])

  const handleIniciarEdicao = () => {
    if (perfil) {
      setEditForm({ ...perfil })
      setIsEditing(true)
      setErro(null)
      setSucesso(null)
    }
  }

  const handleCancelarEdicao = () => {
    setIsEditing(false)
    setEditForm(null)
  }

  const handleInputChange = (campo: keyof PerfilUtilizador, valor: string | null) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [campo]: valor,
      })
    }
  }

  const handleSalvar = async () => {
    if (!editForm) return

    setCarregando(true)
    setErro(null)
    setSucesso(null)

    try {
      const res = await fetch(`/api/utilizadores/${userId}/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) {
        throw new Error('Erro ao atualizar os dados.')
      }

      const dadosAtualizados: PerfilUtilizador = await res.json()
      setPerfil(dadosAtualizados)
      setIsEditing(false)
      setSucesso('Dados pessoais atualizados com sucesso!')
    } catch {
      setErro('Não foi possível salvar os dados. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const inputClass = "w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-base font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#AAB99F] focus:border-transparent transition-all"

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 bg-[#EBEBEB] rounded-4xl shadow-inner overflow-y-auto">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm font-medium">
          {sucesso}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Cartão principal - Informações de contacto */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-300 shadow-sm p-6">
          <div className="text-sm font-bold text-gray-600 mb-2 tracking-wide uppercase">
            Informações Gerais e de Contacto
          </div>

          <InfoRow
            label="Nome Completo"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          >
            {isEditing ? (
              <input
                type="text"
                className={inputClass}
                value={editForm?.nome ?? ''}
                onChange={(e) => handleInputChange('nome', e.target.value)}
              />
            ) : (
              <span className="text-lg font-semibold text-gray-800">{perfil?.nome ?? '—'}</span>
            )}
          </InfoRow>

          <InfoRow
            label="Nome de utilizador"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10a10 10 0 0 0-10-10zM12 19a7 7 0 0 1-7-7 7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7z" />
              </svg>
            }
          >
            <span className="text-lg font-semibold text-gray-400 select-none">
              {perfil?.username ?? '—'}
            </span>
          </InfoRow>

          <InfoRow
            label="Número de Telemóvel"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          >
            {isEditing ? (
              <input
                type="text"
                className={inputClass}
                value={editForm?.telemovel ?? ''}
                onChange={(e) => handleInputChange('telemovel', e.target.value || null)}
              />
            ) : (
              <span className="text-lg font-semibold text-gray-800">{perfil?.telemovel ?? 'Não definido'}</span>
            )}
          </InfoRow>

          <InfoRow
            label="Email"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          >
            {isEditing ? (
              <input
                type="email"
                className={inputClass}
                value={editForm?.email ?? ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            ) : (
              <span className="text-lg font-semibold text-gray-800">{perfil?.email ?? '—'}</span>
            )}
          </InfoRow>
        </div>

        {/* Cartão lateral - Resumo da conta */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 flex flex-col gap-4">
            <div className="text-sm font-bold text-gray-600 tracking-wide uppercase">
              Resumo da conta
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Estado</span>
              <span className="px-3 py-1 rounded-full bg-[#AAB99F]/30 text-[#5c6b56] text-sm font-semibold uppercase">
                {perfil?.tipoUtilizador ?? '—'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 font-medium">Data de Nascimento</span>
              {isEditing ? (
                <input
                  type="date"
                  className={`${inputClass} mt-1`}
                  value={editForm?.dataNascimento ? editForm.dataNascimento.split('T')[0] : ''}
                  onChange={(e) => handleInputChange('dataNascimento', e.target.value || null)}
                />
              ) : (
                <span className="text-sm font-semibold text-gray-800">
                  {formatarData(perfil?.dataNascimento ?? null)}
                </span>
              )}
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={handleIniciarEdicao}
              disabled={!perfil}
              className="w-full py-3 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-50 transition-colors rounded-xl text-white font-medium shadow-sm cursor-pointer"
            >
              Editar Dados
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSalvar}
                disabled={carregando}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors rounded-xl text-white font-medium shadow-sm cursor-pointer"
              >
                {carregando ? 'A Gravar...' : 'Gravar Alterações'}
              </button>
              <button
                onClick={handleCancelarEdicao}
                disabled={carregando}
                className="w-full py-3 bg-gray-400 hover:bg-gray-500 disabled:opacity-50 transition-colors rounded-xl text-white font-medium shadow-sm cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}