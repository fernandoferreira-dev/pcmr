import React, { useState } from 'react'
import DadosPessoais from './dados_pessoais'
import DadosCliente from './dados_cliente'
import Comunicacao from './comunicacao'
import DadosEquipamentos from './dados_equipamentos'

type View = 'home' | 'dados_pessoais' | 'dados_cliente' | 'comunicacao' | 'dados_equipamentos'

const viewTitles: Record<View, string> = {
  home: 'Overview',
  dados_pessoais: 'Dados Pessoais',
  dados_cliente: 'Dados Pacientes',
  comunicacao: 'Comunicação',
  dados_equipamentos: 'Dados Equipamentos',
}

type PaginaInicialProps = {
  userName: string
  onLogout: () => void
}

const OverviewDashboard = () => (
  <div className="flex flex-col gap-4 w-full h-full p-6 bg-[#EBEBEB] rounded-[2rem] shadow-inner overflow-y-auto">
    
    {/* Filtros Superiores*/}
    <div className="text-xs text-gray-500 font-bold tracking-wider shrink-0">
      DIA | SEMANA | MÊS
    </div>

    {/* Linha de Estatísticas */}
    <div className="flex shrink-0 bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm">
      <div className="flex-1 p-4 flex justify-between items-center border-r border-gray-300">
        <div>
          <div className="font-bold text-gray-800 text-sm">Diagnósticos</div>
          <div className="text-xs text-gray-600">NÚMERO</div>
          <div className="text-xs text-gray-600">PERCENTAGEM</div>
        </div>
        <div className="w-8 h-8 bg-red-500 rounded-full shrink-0 shadow-sm" />
      </div>

      <div className="flex-1 p-4 flex justify-between items-center border-r border-gray-300">
        <div>
          <div className="font-bold text-gray-800 text-sm">Pacientes</div>
          <div className="text-xs text-gray-600">NÚMERO</div>
          <div className="text-xs text-gray-600">PERCENTAGEM</div>
        </div>
        <div className="w-8 h-8 bg-red-500 rounded-full shrink-0 shadow-sm" />
      </div>

      <div className="flex-1 p-4 flex justify-between items-center border-r border-gray-300">
        <div>
          <div className="font-bold text-gray-800 text-sm">Nó Sensor</div>
          <div className="text-xs text-gray-600">Estado</div>
        </div>
        <div className="w-8 h-8 bg-red-500 rounded-full shrink-0 shadow-sm" />
      </div>

      <div className="flex-1 p-4 flex justify-between items-center">
        <div>
          <div className="font-bold text-gray-800 text-sm">Servidor</div>
          <div className="text-xs text-gray-600">Estado</div>
        </div>
        <div className="w-8 h-8 bg-red-500 rounded-full shrink-0 shadow-sm" />
      </div>
    </div>

    <div className="flex flex-col flex-1 min-h-[150px] bg-white rounded-xl border border-gray-300 p-4 shadow-sm">
      <div className="text-sm font-semibold text-gray-500">Diagnósticos Totais</div>
      <div className="flex-1 flex items-center justify-center text-3xl font-medium text-gray-800">
        Gráfico
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 shrink-0 h-auto sm:h-48">
      <div className="flex-1 bg-white rounded-xl border border-gray-300 p-4 shadow-sm">
        <div className="text-sm font-bold text-gray-600 mb-2">Notificações</div>
        <div className="text-xs text-gray-500 uppercase">???</div>
        <div className="text-xs text-gray-500 uppercase mt-1">???</div>
      </div>

      {/* Diagnóstico Rápido */}
      <div className="flex-1 bg-white rounded-xl border border-gray-300 p-4 shadow-sm flex flex-col">
        <div className="text-sm font-bold text-gray-600 mb-2">Diagnóstico Rápid</div>
        <div className="flex-1 bg-[#AAB99F] rounded-xl border border-[#91a086] p-4 flex flex-col justify-between">
          <div className="w-10 h-10 bg-white/70 rounded-full flex items-center justify-center text-[#AAB99F] text-3xl font-bold shadow-sm">
            +
          </div>
          <button className="w-full py-2 bg-white/40 rounded-full text-white font-medium hover:bg-white/50 transition-colors shadow-sm">
            Iniciar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  </div>
)

export default function App({ userName, onLogout }: PaginaInicialProps) {
  const [view, setView] = useState<View>('home')

  let content: React.ReactNode
  if (view === 'dados_pessoais') content = <DadosPessoais />
  else if (view === 'dados_cliente') content = <DadosCliente />
  else if (view === 'comunicacao') content = <Comunicacao />
  else if (view === 'dados_equipamentos') content = <DadosEquipamentos />
  else content = <OverviewDashboard />

  const NavButton = ({ id, label }: { id: View; label: string }) => {
    const isActive = view === id
    return (
      <button
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          isActive
            ? 'bg-[#8CA483] font-semibold text-black shadow-sm'
            : 'hover:bg-[#9CB39E] text-gray-800'
        }`}
        onClick={() => setView(id)}
      >
        <div className={`w-6 h-6 rounded-md ${isActive ? 'bg-black' : 'bg-gray-600'}`} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <div className="h-screen w-screen bg-white flex flex-col font-sans overflow-hidden">
      
      <div className="flex-1 flex p-4 gap-6 overflow-hidden"> 
        
        {/* Barra Lateral */}
        <aside className="w-72 h-full bg-[#AAB99F] rounded-[2rem] p-6 shadow-md flex flex-col">
          <div className="flex items-center gap-3 mb-10 mt-2">
            <div className="h-10 w-10 bg-red-600 rounded-sm shadow-sm" />
            <div className="text-2xl font-semibold text-gray-800 tracking-wide">MedyCist</div>
          </div>

          <nav className="flex flex-col gap-2 overflow-y-auto">
            <NavButton id="home" label="Overview" />
            <NavButton id="dados_pessoais" label="Dados Pessoais" />
            <NavButton id="dados_cliente" label="Dados Pacientes" />
            <NavButton id="comunicacao" label="Comunicação" />
            <NavButton id="dados_equipamentos" label="Dados Equipamentos" />
          </nav>
        </aside>

        {/* Área Principal */}
        <main className="flex-1 flex flex-col min-w-0 pr-4 pt-2 pb-4 overflow-hidden">
          
          {/* Cabeçalho */}
          <header className="flex justify-between items-center mb-6 px-2 shrink-0">
            <h1 className="text-3xl font-bold text-gray-700">{viewTitles[view]}</h1>
            
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              title="Clique para fazer Logout"
            >
              <span className="text-xl text-gray-800 font-medium">
                Bem-vindo, {userName}!
              </span>
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white shadow-sm">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
            </button>
          </header>

          {/* Conteúdo Dinâmico */}
          <div className="flex-1 overflow-hidden">
            {content}
          </div>
        </main>
      </div>
      
      <footer className="shrink-0 bg-[#333333] text-gray-400 text-xs py-2 px-6 tracking-wide">
        © 2026 Diogo Rocha - Fernando Ferreira - Jaime Quaresma - João Santos
      </footer>
    </div>
  )
}