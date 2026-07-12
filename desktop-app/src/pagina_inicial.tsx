import { type ReactNode, useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import DadosPessoais from './dados_pessoais'
import DadosDiagnostico from './Dados_Diagnosticos'
import Comunicacao from './comunicacao'
import DadosEquipamentos from './dados_equipamentos'
import { useBiometriaRegisto } from './hooks/useBiometria'
import DiagnosticoRapidoModal from './DiagnosticoRapidoModal'

const OverviewIcon = new URL("./assets/imagens/infographics.png", import.meta.url).href
const DadosDiag = new URL("./assets/imagens/Patient-Profile-59.png", import.meta.url).href
const comunicaicon = new URL("./assets/imagens/phone.png", import.meta.url).href
const dadosequi = new URL("./assets/imagens/server.png", import.meta.url).href
const cruzverde = new URL("./assets/imagens/Untitled design (1).png", import.meta.url).href
const datapessoal = new URL("./assets/imagens/personal-information.png", import.meta.url).href

type View = 'home' | 'dados_diagnostico' | 'comunicacao' | 'dados_equipamentos' | 'dados_pessoais'

type NavButtonProps = {
  id: View
  label: string
  icon?: string
  isActive: boolean
  onClick: (id: View) => void
}

function NavButton({ id, label, icon, isActive, onClick }: NavButtonProps) {
  return (
    <button
      className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors  ${
        isActive
          ? 'bg-[#8CA483] font-semibold text-black shadow-sm'
          : 'hover:bg-[#9CB39E] text-gray-800'
      }`}
      onClick={() => onClick(id)}
    >
      {icon && (
        <img
          src={icon}
          alt={label}
          className="w-7 h-7 object-contain shrink-0"
        />
      )}
      <span>{label}</span>
    </button>
  )
}

const viewTitles: Record<View, string> = {
  home: 'Overview',
  dados_diagnostico: 'Dados Diagnósticos',
  comunicacao: 'Comunicação',
  dados_equipamentos: 'Dados Equipamentos',
  dados_pessoais: 'Dados Pessoais',
}

type PaginaInicialProps = {
  userName: string
  userId: number
  tipo: string 
  onLogout: () => void
}

type OverviewDashboardProps = {
  onAbrirConsulta: () => void
}

interface DiagnosticosPorMes {
  mes: string
  quantidade: number
}

interface EstatisticasOverview {
  totalDiagnosticos: number
  totalPacientes: number
  diagnosticosPorMes: DiagnosticosPorMes[]
}

function formatarMesLabel(mesISO: string): string {
  const [ano, mes] = mesISO.split('-')
  const nomesMeses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ]
  const indice = parseInt(mes, 10) - 1
  return `${nomesMeses[indice] ?? mes}/${ano.slice(2)}`
}

const OverviewDashboard = ({ onAbrirConsulta }: OverviewDashboardProps) => {
  const [stats, setStats] = useState<EstatisticasOverview | null>(null)
  const [erroStats, setErroStats] = useState<string | null>(null)

  useEffect(() => {
    const carregarEstatisticas = async () => {
      try {
        const res = await fetch('/api/estatisticas/overview')
        if (!res.ok) {
          setErroStats('Não foi possível carregar as estatísticas.')
          return
        }
        const data: EstatisticasOverview = await res.json()
        setStats(data)
        setErroStats(null)
      } catch {
        setErroStats('Erro de comunicação com o servidor.')
      }
    }

    carregarEstatisticas()
  }, [])

  const dadosGrafico =
    stats?.diagnosticosPorMes.map((p) => ({
      mes: formatarMesLabel(p.mes),
      quantidade: p.quantidade,
    })) ?? []

  return (
    <div className="flex flex-col gap-4 w-full h-full p-6 bg-[#EBEBEB] rounded-4xl shadow-inner overflow-y-auto">
      <div className="text-xs text-gray-500 font-bold tracking-wider shrink-0">
        DIA | SEMANA | MÊS
      </div>

      <div className="flex shrink-0 bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm">
        <div className="flex-1 p-4 flex justify-between items-center border-r border-gray-300">
          <div>
            <div className="font-bold text-gray-800 text-sm">Diagnósticos</div>
            <div className="text-xs text-gray-600">{stats ? stats.totalDiagnosticos : '—'}</div>
          </div>
          <div className="w-8 h-8 bg-red-500 rounded-full shrink-0 shadow-sm" />
        </div>

        <div className="flex-1 p-4 flex justify-between items-center border-r border-gray-300">
          <div>
            <div className="font-bold text-gray-800 text-sm">Pacientes</div>
            <div className="text-xs text-gray-600">{stats ? stats.totalPacientes : '—'}</div>
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

      <div className="flex flex-col flex-1 min-h-37.5 bg-white rounded-xl border border-gray-300 p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-500 mb-2">Diagnósticos Totais (por mês)</div>
        {erroStats && <div className="flex-1 flex items-center justify-center text-sm text-red-500">{erroStats}</div>}
        {!erroStats && dadosGrafico.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            {stats ? 'Ainda não há diagnósticos registados.' : 'A carregar...'}
          </div>
        )}
        {!erroStats && dadosGrafico.length > 0 && (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantidade" name="Diagnósticos" fill="#AAB99F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 shrink-0 h-auto sm:h-48">
        <div className="flex-1 bg-white rounded-xl border border-gray-300 p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-600 mb-2">Notificações</div>
          <div className="text-xs text-gray-500 uppercase">???</div>
          <div className="text-xs text-gray-500 uppercase mt-1">???</div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-300 p-4 shadow-sm flex flex-col">
          <div className="text-sm font-bold text-gray-600 mb-2">Consulta Rápida</div>
          <div className="flex-1 bg-[#AAB99F] rounded-xl border border-[#91a086] p-4 flex flex-col justify-between">
            <div className="w-10 h-10 bg-white/70 rounded-full flex items-center justify-center text-[#AAB99F] text-3xl font-bold shadow-sm">
              <img src={cruzverde} alt="Diagnóstico" className="w-6 h-6 object-contain"/>
            </div>
            <button
              onClick={onAbrirConsulta}
              className="w-full py-2 bg-white/40 rounded-full text-white font-medium hover:bg-white/50 transition-colors shadow-sm cursor-pointer"
            >
              Iniciar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App({ userName, userId, tipo, onLogout }: PaginaInicialProps) {
  const [view, setView] = useState<View>('home')
  const [modalAberto, setModalAberto] = useState(false)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  const tipoNormalizado = (tipo || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const esMedico = tipoNormalizado === 'medico';

  // BARREIRA 1: Bloqueio ativo no estado (Redirecionamento)
  useEffect(() => {
    if (esMedico && view === 'dados_equipamentos') {
      setView('home')
    }
  }, [view, esMedico])

  const {
    status: bioStatus,
    mensagem: bioMensagem,
    iniciarRegisto,
    cancelar: bioCancelar,
  } = useBiometriaRegisto()

  let content: ReactNode
  if (view === 'dados_diagnostico') content = <DadosDiagnostico />
  else if (view === 'comunicacao') content = <Comunicacao userId={userId}/>
  else if (view === 'dados_equipamentos' && !esMedico) content = <DadosEquipamentos userId={userId} />
  else if (view === 'dados_pessoais') content = <DadosPessoais userId={userId} />
  else content = (
    <OverviewDashboard
      key={statsRefreshKey}
      onAbrirConsulta={() => setModalAberto(true)}
    />
  )

  return (
    <div className="h-screen w-screen bg-(--background) flex flex-col font-sans overflow-hidden relative">
      <div className="flex-1 flex p-4 gap-6 overflow-hidden">

        {/* Barra Lateral */}
        <aside className="w-72 h-full bg-[#AAB99F] rounded-4xl p-6 shadow-md flex flex-col">
          <div className="flex items-center gap-3 mb-10 mt-2">
            <div className="h-10 w-10 bg-red-600 rounded-sm shadow-sm" />
            <div className="text-2xl font-semibold text-gray-800 tracking-wide">MedyCist</div>
          </div>

          <nav className="flex flex-col gap-2 overflow-y-auto">
            <NavButton id="home" label="Overview" icon={OverviewIcon} isActive={view === 'home'} onClick={setView} />
            <NavButton id="dados_diagnostico" label="Dados Diagnósticos" icon={DadosDiag} isActive={view === 'dados_diagnostico'} onClick={setView} />
            <NavButton id="comunicacao" label="Comunicação" icon={comunicaicon} isActive={view === 'comunicacao'} onClick={setView} />
            
            {!esMedico && (
              <NavButton id="dados_equipamentos" label="Dados Equipamentos" icon={dadosequi} isActive={view === 'dados_equipamentos'} onClick={setView} />
            )}
            
            <NavButton id="dados_pessoais" label="Dados Pessoais" icon={datapessoal} isActive={view === 'dados_pessoais'} onClick={setView} />
          </nav>
        </aside>

        {/* Área Principal */}
        <main className="flex-1 flex flex-col min-w-0 pr-4 pt-2 pb-4 overflow-hidden bg-(--background)">
          <header className="flex justify-between items-center mb-6 px-2 shrink-0">
            <h1 className="text-3xl font-bold text-gray-700">{viewTitles[view]}</h1>

            <div className="flex items-center gap-4">
              {(bioStatus === 'idle' || bioStatus === 'sucesso' || bioStatus === 'erro') && (
                <button
                  onClick={() => iniciarRegisto(userId)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                  title="Associar impressão digital a esta conta"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10" /><path d="M5 12C5 8.1 8.1 5 12 5s7 3.1 7 7" /><path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" /><circle cx="12" cy="12" r="2" /><path d="M2 12h20" />
                  </svg>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {bioStatus === 'idle' ? 'Associar Impressão Digital' : bioStatus === 'sucesso' ? '✓ Registada' : 'Tentar Novamente'}
                  </span>
                </button>
              )}

              {bioStatus !== 'idle' && (
                <div className={`text-xs px-3 py-1.5 rounded-lg ${
                  bioStatus === 'aguardar_dedo' || bioStatus === 'a_processar' ? 'bg-blue-100 text-blue-800' : bioStatus === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span>{bioMensagem}</span>
                  {(bioStatus === 'aguardar_dedo' || bioStatus === 'a_processar') && (
                    <button onClick={bioCancelar} className="ml-2 underline cursor-pointer">Cancelar</button>
                  )}
                </div>
              )}

              <button onClick={onLogout} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer" title="Clique para fazer Logout">
                <span className="text-xl text-gray-800 font-medium">Bem-vindo, {userName}! ({tipo})</span>
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white shadow-sm">
                  <div className="w-5 h-5 bg-white rounded-sm" />
                </div>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden bg-(--background)">
            {content}
          </div>
        </main>
      </div>

      <footer className="shrink-0 bg-[#333333] text-gray-400 text-xs py-2 px-6 tracking-wide">
        © 2026 Diogo Rocha - Fernando Ferreira - Jaime Quaresma - João Santos
      </footer>

      {modalAberto && (
        <DiagnosticoRapidoModal
          onClose={() => {
            setModalAberto(false)
            setStatsRefreshKey((k) => k + 1)
          }}
          idMedico={userId}
        />
      )}
    </div>
  )
}