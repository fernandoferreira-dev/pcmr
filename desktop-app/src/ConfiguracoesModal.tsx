import { useState, useEffect } from 'react'

interface ConfiguracaoSistema {
  temperaturaMaxAlerta: number
  temperaturaMinAlerta: number
  bpmMaxAlerta: number
  bpmMinAlerta: number
  atualizadoEm: string
}

interface SensorNo {
  idSensor: number
  nome: string
  localizacao: string | null
  estado: string
}

type Aba = 'limites' | 'nos'
type EstadoPing = 'idle' | 'a_testar' | 'online' | 'offline'

export default function ConfiguracoesModal({
  idUtilizador,
  onClose,
}: {
  idUtilizador: number
  onClose: () => void
}) {
  const [aba, setAba] = useState<Aba>('limites')

  // Limites de alerta
  const [config, setConfig] = useState<ConfiguracaoSistema | null>(null)
  const [temperaturaMaxInput, setTemperaturaMaxInput] = useState('')
  const [temperaturaMinInput, setTemperaturaMinInput] = useState('')
  const [bpmMaxInput, setBpmMaxInput] = useState('')
  const [bpmMinInput, setBpmMinInput] = useState('')
  const [aGuardarConfig, setAGuardarConfig] = useState(false)
  const [erroConfig, setErroConfig] = useState<string | null>(null)
  const [sucessoConfig, setSucessoConfig] = useState(false)

  // Nós sensores
  const [sensores, setSensores] = useState<SensorNo[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [novaLocalizacao, setNovaLocalizacao] = useState('')
  const [aCriarSensor, setACriarSensor] = useState(false)
  const [erroSensor, setErroSensor] = useState<string | null>(null)
  const [estadosPing, setEstadosPing] = useState<Record<string, EstadoPing>>({})

  useEffect(() => {
    carregarConfig()
    carregarSensores()
  }, [])

  const carregarConfig = async () => {
    try {
      const res = await fetch('/api/configuracoes')
      if (!res.ok) return
      const data: ConfiguracaoSistema = await res.json()
      setConfig(data)
      setTemperaturaMaxInput(data.temperaturaMaxAlerta.toString())
      setTemperaturaMinInput(data.temperaturaMinAlerta.toString())
      setBpmMaxInput(data.bpmMaxAlerta.toString())
      setBpmMinInput(data.bpmMinAlerta.toString())
    } catch {
      setErroConfig('Erro ao carregar configuração.')
    }
  }

  const carregarSensores = async () => {
    try {
      const res = await fetch('/api/sensores')
      if (!res.ok) return
      const data: SensorNo[] = await res.json()
      setSensores(data)
    } catch {
      setErroSensor('Erro ao carregar nós sensores.')
    }
  }

  // VALIDAÇÃO EM TEMPO REAL:
  const tempMinNum = parseFloat(temperaturaMinInput)
  const tempMaxNum = parseFloat(temperaturaMaxInput)
  const bpmMinNum = parseInt(bpmMinInput, 10)
  const bpmMaxNum = parseInt(bpmMaxInput, 10)

  const isTemperaturasInvalidas = tempMinNum >= tempMaxNum
  const isBpmsInvalidos = bpmMinNum >= bpmMaxNum
  const isCamposVazios = isNaN(tempMinNum) || isNaN(tempMaxNum) || isNaN(bpmMinNum) || isNaN(bpmMaxNum)
  
  // O botão desativa se algum limite estiver incorreto
  const btnGuardarDesativado = aGuardarConfig || isTemperaturasInvalidas || isBpmsInvalidos || isCamposVazios

  const guardarConfig = async () => {
    if (isCamposVazios) {
      setErroConfig('Introduz valores numéricos válidos em todos os campos.')
      return
    }

    if (isTemperaturasInvalidas) {
      setErroConfig('A temperatura mínima deve ser inferior à máxima.')
      return
    }

    if (isBpmsInvalidos) {
      setErroConfig('O BPM mínimo deve ser inferior ao máximo.')
      return
    }

    setAGuardarConfig(true)
    setErroConfig(null)
    setSucessoConfig(false)

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperaturaMaxAlerta: tempMaxNum,
          temperaturaMinAlerta: tempMinNum,
          bpmMaxAlerta: bpmMaxNum,
          bpmMinAlerta: bpmMinNum,
          idUtilizadorAtualizou: idUtilizador,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErroConfig(data.erro || 'Não foi possível guardar a configuração.')
        return
      }

      setConfig(data)
      setSucessoConfig(true)
      setTimeout(() => setSucessoConfig(false), 2000)
    } catch {
      setErroConfig('Erro de comunicação com o servidor.')
    } finally {
      setAGuardarConfig(false)
    }
  }

  const criarSensor = async () => {
    if (!novoNome.trim()) {
      setErroSensor('O identificador do sensor é obrigatório.')
      return
    }

    setACriarSensor(true)
    setErroSensor(null)

    try {
      const res = await fetch('/api/sensores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome, localizacao: novaLocalizacao }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErroSensor(data.erro || 'Não foi possível adicionar o sensor.')
        return
      }

      setSensores((prev) => [...prev, data])
      setNovoNome('')
      setNovaLocalizacao('')
    } catch {
      setErroSensor('Erro de comunicação com o servidor.')
    } finally {
      setACriarSensor(false)
    }
  }

  const testarPing = async (deviceId: string) => {
    setEstadosPing((prev) => ({ ...prev, [deviceId]: 'a_testar' }))

    try {
      const res = await fetch(`/api/sensores/${deviceId}/ping`)
      if (!res.ok) {
        setEstadosPing((prev) => ({ ...prev, [deviceId]: 'offline' }))
        return
      }
      const data = await res.json()
      setEstadosPing((prev) => ({ ...prev, [deviceId]: data.online ? 'online' : 'offline' }))
    } catch {
      setEstadosPing((prev) => ({ ...prev, [deviceId]: 'offline' }))
    }
  }

  const corEstado = (estado: EstadoPing) => {
    switch (estado) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'a_testar': return 'bg-yellow-500 animate-pulse'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl cursor-pointer"
          title="Fechar"
        >
          ✕
        </button>

        <div className="p-6 pb-0">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Definições do Sistema</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAba('limites')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                aba === 'limites' ? 'bg-[#AAB99F] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Limites de Alerta
            </button>
            <button
              onClick={() => setAba('nos')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                aba === 'nos' ? 'bg-[#AAB99F] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Nós Sensores
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {aba === 'limites' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Define os valores mínimo e máximo que, quando ultrapassados, geram um alerta
                clínico registado automaticamente na base de dados.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-700">Temperatura mínima (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    max={temperaturaMaxInput} 
                    value={temperaturaMinInput}
                    onChange={(e) => setTemperaturaMinInput(e.target.value)}
                    className={`border rounded-xl px-3 py-2 text-sm ${isTemperaturasInvalidas ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-700">Temperatura máxima (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    min={temperaturaMinInput} // Atributo min dinâmico
                    value={temperaturaMaxInput}
                    onChange={(e) => setTemperaturaMaxInput(e.target.value)}
                    className={`border rounded-xl px-3 py-2 text-sm ${isTemperaturasInvalidas ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-700">FC mínima (bpm)</span>
                  <input
                    type="number"
                    max={bpmMaxInput} // Atributo max dinâmico
                    value={bpmMinInput}
                    onChange={(e) => setBpmMinInput(e.target.value)}
                    className={`border rounded-xl px-3 py-2 text-sm ${isBpmsInvalidos ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-700">FC máxima (bpm)</span>
                  <input
                    type="number"
                    min={bpmMinInput} // Atributo min dinâmico
                    value={bpmMaxInput}
                    onChange={(e) => setBpmMaxInput(e.target.value)}
                    className={`border rounded-xl px-3 py-2 text-sm ${isBpmsInvalidos ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                </label>
              </div>

              {/* Avisos em tempo real */}
              {isTemperaturasInvalidas && <p className="text-sm text-red-600">A temperatura mínima deve ser inferior à máxima.</p>}
              {isBpmsInvalidos && <p className="text-sm text-red-600">O BPM mínimo deve ser inferior ao máximo.</p>}

              {config && (
                <p className="text-xs text-gray-400">
                  Última atualização: {new Date(config.atualizadoEm).toLocaleString('pt-PT')}
                </p>
              )}

              {erroConfig && <p className="text-sm text-red-600">{erroConfig}</p>}
              {sucessoConfig && <p className="text-sm text-green-600">✓ Configuração guardada.</p>}

              <button
                onClick={guardarConfig}
                disabled={btnGuardarDesativado}
                className="py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm cursor-pointer"
              >
                {aGuardarConfig ? 'A guardar...' : 'Guardar Limites'}
              </button>
            </div>
          )}

          {aba === 'nos' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {sensores.map((s) => {
                  const estado = estadosPing[s.nome] ?? 'idle'
                  return (
                    <div
                      key={s.idSensor}
                      className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${corEstado(estado)}`} />
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{s.nome}</div>
                          <div className="text-xs text-gray-500">{s.localizacao || 'Sem localização definida'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => testarPing(s.nome)}
                        disabled={estado === 'a_testar'}
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-xs font-semibold text-gray-700 rounded-full transition-colors cursor-pointer"
                      >
                        {estado === 'a_testar' ? 'A testar...' : 'Ping'}
                      </button>
                    </div>
                  )
                })}
                {sensores.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum nó registado ainda.</p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-700">Adicionar novo nó</p>

                <input
                  type="text"
                  placeholder="Identificador (ex: node1-presenca)"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Localização (opcional)"
                  value={novaLocalizacao}
                  onChange={(e) => setNovaLocalizacao(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />

                {erroSensor && <p className="text-sm text-red-600">{erroSensor}</p>}

                <button
                  onClick={criarSensor}
                  disabled={aCriarSensor}
                  className="py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-50 rounded-full text-white font-medium transition-colors shadow-sm cursor-pointer"
                >
                  {aCriarSensor ? 'A adicionar...' : 'Adicionar Nó'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}