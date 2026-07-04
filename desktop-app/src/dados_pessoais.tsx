import React from 'react'

type DadosPessoaisProps = {
  nomeUtilizador?: string
  numeroTelemovel?: string
  email?: string
  estado?: string
  dataNascimento?: string
}

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0">
    <div className="w-12 h-12 rounded-full bg-[#AAB99F] flex items-center justify-center shrink-0 shadow-sm text-white">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</span>
      <span className="text-lg font-semibold text-gray-800">{value}</span>
    </div>
  </div>
)

export default function DadosPessoais({
  nomeUtilizador = 'Nome',
  numeroTelemovel = 'Número',
  email = 'Email',
  estado = 'ESTADO',
  dataNascimento = 'DATA',
}: DadosPessoaisProps) {
  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 bg-[#EBEBEB] rounded-[2rem] shadow-inner overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Cartão principal - Informações de contacto */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-300 shadow-sm p-6">
          <div className="text-sm font-bold text-gray-600 mb-2 tracking-wide uppercase">
            Informações de Contacto
          </div>

          <InfoRow
            label="Nome de utilizador"
            value={nomeUtilizador}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
          <InfoRow
            label="Número de Telemóvel"
            value={numeroTelemovel}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          />
          <InfoRow
            label="Email"
            value={email}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          />
        </div>

        {/* Cartão lateral - Resumo da conta */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 flex flex-col gap-4">
            <div className="text-sm font-bold text-gray-600 tracking-wide uppercase">
              Resumo da conta
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Estado</span>
              <span className="px-3 py-1 rounded-full bg-[#AAB99F]/30 text-[#5c6b56] text-sm font-semibold">
                {estado}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Data de Nascimento</span>
              <span className="text-sm font-semibold text-gray-800">{dataNascimento}</span>
            </div>
          </div>

          <button className="w-full py-3 bg-[#AAB99F] hover:bg-[#9CB39E] transition-colors rounded-xl text-white font-medium shadow-sm">
            Editar Dados
          </button>
        </div>
      </div>
    </div>
  )
}