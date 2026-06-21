import React, { useState } from 'react'
import DadosPessoais from './dados_pessoais'
import DadosCliente from './dados_cliente'
import Comunicacao from './comunicacao'
import DadosEquipamentos from './dados_equipamentos'

type View = 'home' | 'dados_pessoais' | 'dados_cliente' | 'comunicacao' | 'dados_equipamentos'

export default function App() {
  const [view, setView] = useState<View>('home')

  if (view === 'dados_pessoais') return <DadosPessoais />
  if (view === 'dados_cliente') return <DadosCliente />
  if (view === 'comunicacao') return <Comunicacao />
  if (view === 'dados_equipamentos') return <DadosEquipamentos />

  return (
    <div className="app-container p-6">
      <h1 className="text-2xl font-semibold mb-4">Página Inicial</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <button className="btn-primary" onClick={() => setView('dados_pessoais')}>Dados Pessoais</button>
        <button className="btn-primary" onClick={() => setView('dados_cliente')}>Dados Cliente</button>
        <button className="btn-primary" onClick={() => setView('comunicacao')}>Comunicação</button>
        <button className="btn-primary" onClick={() => setView('dados_equipamentos')}>Dados Equipamentos</button>
      </div>
    </div>
  )
}