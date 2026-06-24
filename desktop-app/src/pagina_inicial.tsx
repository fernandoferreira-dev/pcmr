import React, { useState } from 'react'
import DadosPessoais from './dados_pessoais'
import DadosCliente from './dados_cliente'
import Comunicacao from './comunicacao'
import DadosEquipamentos from './dados_equipamentos'

type View = 'home' | 'dados_pessoais' | 'dados_cliente' | 'comunicacao' | 'dados_equipamentos'

const viewTitles: Record<View, string> = {
  home: 'Página Inicial',
  dados_pessoais: 'Dados Pessoais',
  dados_cliente: 'Dados Pacientes',
  comunicacao: 'Comunicação',
  dados_equipamentos: 'Dados Equipamentos',
}

type PaginaInicialProps = {
  userName: string
  onLogout: () => void
}

export default function App({ userName, onLogout }: PaginaInicialProps) {
  const [view, setView] = useState<View>('home')

  let content: React.ReactNode
  if (view === 'dados_pessoais') content = <DadosPessoais />
  else if (view === 'dados_cliente') content = <DadosCliente />
  else if (view === 'comunicacao') content = <Comunicacao />
  else if (view === 'dados_equipamentos') content = <DadosEquipamentos />
  else {
    content = (
      <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-gray-700">
        <p className="text-lg font-medium mb-2">Escolha uma funcionalidade na barra lateral.</p>
        <p className="text-sm text-gray-600">As opções principais estão disponíveis no menu à esquerda.</p>
      </div>
    )
  }

  const NavButton = ({ id, label }: { id: View; label: string }) => (
    <button
      className={
        'w-full text-left px-4 py-3 rounded-md hover:bg-gray-200 ' +
        (view === id ? 'bg-gray-200 font-medium' : '')
      }
      onClick={() => setView(id)}
    >
      {label}
    </button>
  )

  return (
    <div className="app-container p-6">
      <div className="flex gap-6 h-[calc(100vh-3rem)]">
        <aside className="w-64 bg-green-100 rounded-lg p-4 shadow-sm">
          <div className="mb-6">
            <div className="h-10 w-10 bg-red-500 rounded-sm mb-2" />
            <div className="text-lg font-semibold">MedyCist</div>
          </div>

          <nav className="flex flex-col gap-2">
            <NavButton id="home" label="Overview" />
            <NavButton id="dados_pessoais" label="Dados Pessoais" />
            <NavButton id="dados_cliente" label="Dados Pacientes" />
            <NavButton id="comunicacao" label="Comunicação" />
            <NavButton id="dados_equipamentos" label="Dados Equipamentos" />
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-lg p-6 shadow-sm overflow-auto flex flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">{viewTitles[view]}</h1>
              {view === 'home' && <p className="text-gray-600">Escolha uma funcionalidade na barra lateral.</p>}
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-sm sm:text-base text-gray-700 font-medium whitespace-nowrap">
                Bem-vindo, {userName}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex-1">{content}</div>
        </main>
      </div>
    </div>
  )
}