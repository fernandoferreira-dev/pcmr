import React, { useState } from 'react'
import DadosPessoais from './dados_pessoais'
import DadosCliente from './dados_cliente'
import Comunicacao from './comunicacao'
import DadosEquipamentos from './dados_equipamentos'

type View = 'home' | 'dados_pessoais' | 'dados_cliente' | 'comunicacao' | 'dados_equipamentos'

export default function App() {
  const [view, setView] = useState<View>('home')

  let content: React.ReactNode
  if (view === 'dados_pessoais') content = <DadosPessoais />
  else if (view === 'dados_cliente') content = <DadosCliente />
  else if (view === 'comunicacao') content = <Comunicacao />
  else if (view === 'dados_equipamentos') content = <DadosEquipamentos />
  else {
    content = (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Página Inicial</h1>
        <p className="mb-4">Escolha uma funcionalidade na barra lateral.</p>
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
      <div className="flex gap-6">
        <aside className="w-64 bg-gray-50 rounded-lg p-4 shadow-sm">
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

        <main className="flex-1 bg-white rounded-lg p-6 shadow-sm">
          {content}
        </main>
      </div>
    </div>
  )
}