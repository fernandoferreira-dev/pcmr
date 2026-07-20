import { useState, useEffect } from 'react'

interface SensorNo {
  idSensor: number
  nome: string
  nomeExibicao: string | null // <-- NOVO: adicionado
  localizacao: string | null
  estado: string
  tipoMetrica: 'WEARABLE' | 'PRESENCA' | 'BIOMETRICO' | 'GENERICO'
}

interface ConfiguracaoWearable {
  idSensor: number
  temperaturaMaxAlerta: number
  temperaturaMinAlerta: number
  bpmMaxAlerta: number
  bpmMinAlerta: number
  atualizadoEm: string
}

interface ConfiguracaoPresenca {
  idSensor: number
  distanciaDeteccaoCm: number
  tempoConfirmacaoSegundos: number
  atualizadoEm: string
}

type Aba = 'nos' | 'configurar'
type EstadoPing = 'idle' | 'a_testar' | 'online' | 'offline'

const TIPOS_LABEL: Record<SensorNo['tipoMetrica'], string> = {
  WEARABLE: 'Wearable (Temp./BPM)',
  PRESENCA: 'Proximidade (HC-SR04)',
  BIOMETRICO: 'Biometria',
  GENERICO: 'Genérico',
}

export default function ConfiguracoesModal({
  idUtilizador,
  onClose,
}: {
  idUtilizador: number
  onClose: () => void
}) {
  const [aba, setAba] = useState<Aba>('nos')

  // Nós sensores
  const [sensores, setSensores] = useState<SensorNo[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [novaLocalizacao, setNovaLocalizacao] = useState('')
  const [novoTipo, setNovoTipo] = useState<SensorNo['tipoMetrica']>('GENERICO')
  const [aCriarSensor, setACriarSensor] = useState(false)
  const [erroSensor, setErroSensor] = useState<string | null>(null)
  const [estadosPing, setEstadosPing] = useState<Record<string, EstadoPing>>({})

  const [sensorSelecionadoId, setSensorSelecionadoId] = useState<number | null>(null)

  const [nomeExibicaoInput, setNomeExibicaoInput] = useState('')
  const [aRenomear, setARenomear] = useState(false)
  const [erroRenomear, setErroRenomear] = useState<string | null>(null)
  const [sucessoRenomear, setSucessoRenomear] = useState(false)

  const [configWearable, setConfigWearable] = useState<ConfiguracaoWearable | null>(null)
  const [temperaturaMaxInput, setTemperaturaMaxInput] = useState('')
  const [temperaturaMinInput, setTemperaturaMinInput] = useState('')
  const [bpmMaxInput, setBpmMaxInput] = useState('')
  const [bpmMinInput, setBpmMinInput] = useState('')

  const [configPresenca, setConfigPresenca] = useState<ConfiguracaoPresenca | null>(null)
  const [distanciaInput, setDistanciaInput] = useState('')
  const [tempoInput, setTempoInput] = useState('')

  const [aGuardar, setAGuardar] = useState(false)
  const [erroConfig, setErroConfig] = useState<string | null>(null)
  const [sucessoConfig, setSucessoConfig] = useState(false)

  useEffect(() => {
    carregarSensores()
  }, [])

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

  const sensorSelecionado = sensores.find((s) => s.idSensor === sensorSelecionadoId) ?? null

  const selecionarSensorParaConfigurar = async (sensor: SensorNo) => {
    setSensorSelecionadoId(sensor.idSensor)
    setAba('configurar')
    setErroConfig(null)
    setSucessoConfig(false)
    setErroRenomear(null)
    setSucessoRenomear(false)
    setNomeExibicaoInput(sensor.nomeExibicao || '')

    setConfigWearable(null)
    setConfigPresenca(null)

    if (sensor.tipoMetrica === 'WEARABLE') {
      try {
        const res = await fetch(`/api/configuracoes?idSensor=${sensor.idSensor}`)
        if (!res.ok) return
        const data: ConfiguracaoWearable = await res.json()
        setConfigWearable(data)
        setTemperaturaMaxInput(data.temperaturaMaxAlerta.toString())
        setTemperaturaMinInput(data.temperaturaMinAlerta.toString())
        setBpmMaxInput(data.bpmMaxAlerta.toString())
        setBpmMinInput(data.bpmMinAlerta.toString())
      } catch {
        setErroConfig('Erro ao carregar configuração.')
      }
    } else if (sensor.tipoMetrica === 'PRESENCA') {
      try {
        const res = await fetch(`/api/presenca/config?idSensor=${sensor.idSensor}`)
        if (!res.ok) return
        const data: ConfiguracaoPresenca = await res.json()
        setConfigPresenca(data)
        setDistanciaInput(data.distanciaDeteccaoCm.toString())
        setTempoInput(data.tempoConfirmacaoSegundos.toString())
      } catch {
        setErroConfig('Erro ao carregar configuração.')
      }
    }
  }

  const guardarNomeExibicao = async () => {
    if (!sensorSelecionadoId) return

    setARenomear(true)
    setErroRenomear(null)
    setSucessoRenomear(false)

    try {
      const res = await fetch(`/api/sensores/${sensorSelecionadoId}/nome-exibicao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeExibicao: nomeExibicaoInput }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErroRenomear(data.erro || 'Não foi possível renomear o sensor.')
        return
      }

      // Atualiza a lista na UI
      setSensores((prev) =>
        prev.map((s) => (s.idSensor === sensorSelecionadoId ? { ...s, nomeExibicao: data.nomeExibicao } : s))
      )
      
      setSucessoRenomear(true)
      setTimeout(() => setSucessoRenomear(false), 2000)
    } catch {
      setErroRenomear('Erro de comunicação com o servidor.')
    } finally {
      setARenomear(false)
    }
  }

  // Validação em tempo real (Wearable)
  const tempMinNum = parseFloat(temperaturaMinInput)
  const tempMaxNum = parseFloat(temperaturaMaxInput)
  const bpmMinNum = parseInt(bpmMinInput, 10)
  const bpmMaxNum = parseInt(bpmMaxInput, 10)
  const isTemperaturasInvalidas = tempMinNum >= tempMaxNum
  const isBpmsInvalidos = bpmMinNum >= bpmMaxNum
  const isCamposWearableVazios = [tempMinNum, tempMaxNum, bpmMinNum, bpmMaxNum].some((v) => isNaN(v))
  const btnWearableDesativado = aGuardar || isTemperaturasInvalidas || isBpmsInvalidos || isCamposWearableVazios

  // Validação em tempo real (Presença)
  const distanciaNum = parseFloat(distanciaInput)
  const tempoNum = parseInt(tempoInput, 10)
  const isPresencaInvalida = isNaN(distanciaNum) || distanciaNum <= 0 || isNaN(tempoNum) || tempoNum <= 0
  const btnPresencaDesativado = aGuardar || isPresencaInvalida

  const guardarWearable = async () => {
    if (!sensorSelecionadoId) return

    setAGuardar(true)
    setErroConfig(null)
    setSucessoConfig(false)

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idSensor: sensorSelecionadoId,
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

      setConfigWearable(data)
      setSucessoConfig(true)
      setTimeout(() => setSucessoConfig(false), 2000)
    } catch {
      setErroConfig('Erro de comunicação com o servidor.')
    } finally {
      setAGuardar(false)
    }
  }

  const guardarPresenca = async () => {
    if (!sensorSelecionadoId) return

    setAGuardar(true)
    setErroConfig(null)
    setSucessoConfig(false)

    try {
      const res = await fetch('/api/presenca/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idSensor: sensorSelecionadoId,
          distanciaDeteccaoCm: distanciaNum,
          tempoConfirmacaoSegundos: tempoNum,
          idUtilizadorAtualizou: idUtilizador,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErroConfig(data.erro || 'Não foi possível guardar a configuração.')
        return
      }

      setConfigPresenca(data)
      setSucessoConfig(true)
      setTimeout(() => setSucessoConfig(false), 2000)
    } catch {
      setErroConfig('Erro de comunicação com o servidor.')
    } finally {
      setAGuardar(false)
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
        body: JSON.stringify({ nome: novoNome, localizacao: novaLocalizacao, tipoMetrica: novoTipo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErroSensor(data.erro || 'Não foi possível adicionar o sensor.')
        return
      }

      setSensores((prev) => [...prev, data])
      setNovoNome('')
      setNovaLocalizacao('')
      setNovoTipo('GENERICO')
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
              onClick={() => setAba('nos')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                aba === 'nos' ? 'bg-[#AAB99F] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Nós Sensores
            </button>
            <button
              onClick={() => setAba('configurar')}
              disabled={!sensorSelecionado}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                aba === 'configurar' ? 'bg-[#AAB99F] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Configurar Sensor {sensorSelecionado ? `— ${sensorSelecionado.nomeExibicao || sensorSelecionado.nome}` : ''}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${corEstado(estado)}`} />
                        <div className="min-w-0">
                          {/* Modificado para mostrar o nome de exibição caso exista */}
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {s.nomeExibicao ? `${s.nomeExibicao} ` : s.nome}
                            {s.nomeExibicao && <span className="font-normal text-xs text-gray-400">({s.nome})</span>}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {s.localizacao || 'Sem localização definida'} · {TIPOS_LABEL[s.tipoMetrica]}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => testarPing(s.nome)}
                          disabled={estado === 'a_testar'}
                          className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-xs font-semibold text-gray-700 rounded-full transition-colors cursor-pointer"
                        >
                          {estado === 'a_testar' ? 'A testar...' : 'Ping'}
                        </button>
                        {/* Removida a limitação de tipo de métrica para que TODOS possam ser renomeados */}
                        <button
                          onClick={() => selecionarSensorParaConfigurar(s)}
                          className="px-3 py-1.5 bg-[#AAB99F] hover:bg-[#9CB39E] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
                        >
                          Configurar
                        </button>
                      </div>
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

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-600">Tipo de sensor</span>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as SensorNo['tipoMetrica'])}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer"
                  >
                    <option value="WEARABLE">Wearable (Temperatura / BPM) — ex: wearable01</option>
                    <option value="PRESENCA">Proximidade (HC-SR04) — ex: node1-presenca</option>
                    <option value="BIOMETRICO">Biometria — ex: esp32-pico-fingerprint</option>
                    <option value="GENERICO">Genérico (sem parâmetros configuráveis)</option>
                  </select>
                </label>

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

          {aba === 'configurar' && sensorSelecionado && (
            <div className="flex flex-col gap-6">
              
              {/* NOVO: Bloco de Renomear o Sensor (Comum a todos) */}
              <div className="flex flex-col gap-3 pb-5 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Nome de Exibição</p>
                  <p className="text-xs text-gray-500">
                    O identificador real (usado em MQTT e pings) manterá o valor <strong>{sensorSelecionado.nome}</strong>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nomeExibicaoInput}
                    onChange={(e) => setNomeExibicaoInput(e.target.value)}
                    placeholder="Ex: Sensor do Quarto"
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm flex-1"
                  />
                  <button
                    onClick={guardarNomeExibicao}
                    disabled={aRenomear}
                    className="px-4 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {aRenomear ? 'A guardar...' : 'Guardar Nome'}
                  </button>
                </div>
                {erroRenomear && <p className="text-sm text-red-600">{erroRenomear}</p>}
                {sucessoRenomear && <p className="text-sm text-green-600">✓ Nome de exibição atualizado.</p>}
              </div>

              {/* Configurações específicas de WEARABLE */}
              {sensorSelecionado.tipoMetrica === 'WEARABLE' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500">
                    Valores mínimo e máximo para <strong>{sensorSelecionado.nome}</strong> que,
                    quando ultrapassados, geram um alerta clínico.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-700">Temperatura mínima (°C)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={temperaturaMinInput}
                        onChange={(e) => setTemperaturaMinInput(e.target.value)}
                        className={`border rounded-xl px-3 py-2 text-sm ${isTemperaturasInvalidas ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-700">Temperatura máxima (°C)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={temperaturaMaxInput}
                        onChange={(e) => setTemperaturaMaxInput(e.target.value)}
                        className={`border rounded-xl px-3 py-2 text-sm ${isTemperaturasInvalidas ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-700">FC mínima (bpm)</span>
                      <input
                        type="number"
                        value={bpmMinInput}
                        onChange={(e) => setBpmMinInput(e.target.value)}
                        className={`border rounded-xl px-3 py-2 text-sm ${isBpmsInvalidos ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-700">FC máxima (bpm)</span>
                      <input
                        type="number"
                        value={bpmMaxInput}
                        onChange={(e) => setBpmMaxInput(e.target.value)}
                        className={`border rounded-xl px-3 py-2 text-sm ${isBpmsInvalidos ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </label>
                  </div>

                  {isTemperaturasInvalidas && <p className="text-sm text-red-600">A temperatura mínima deve ser inferior à máxima.</p>}
                  {isBpmsInvalidos && <p className="text-sm text-red-600">O BPM mínimo deve ser inferior ao máximo.</p>}

                  {configWearable && (
                    <p className="text-xs text-gray-400">
                      Última atualização: {new Date(configWearable.atualizadoEm).toLocaleString('pt-PT')}
                    </p>
                  )}

                  {erroConfig && <p className="text-sm text-red-600">{erroConfig}</p>}
                  {sucessoConfig && <p className="text-sm text-green-600">✓ Configuração guardada.</p>}

                  <button
                    onClick={guardarWearable}
                    disabled={btnWearableDesativado}
                    className="py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    {aGuardar ? 'A guardar...' : 'Guardar Limites'}
                  </button>
                </div>
              )}

              {/* Configurações específicas de PRESENCA */}
              {sensorSelecionado.tipoMetrica === 'PRESENCA' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500">
                    Parâmetros de deteção de presença para <strong>{sensorSelecionado.nome}</strong>.
                    Alterações são enviadas de imediato ao ESP32 via MQTT.
                  </p>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-gray-700">Distância de deteção (cm)</span>
                    <input
                      type="number"
                      step="1"
                      value={distanciaInput}
                      onChange={(e) => setDistanciaInput(e.target.value)}
                      className={`border rounded-xl px-3 py-2 text-sm ${isPresencaInvalida ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-gray-700">Tempo de confirmação (segundos)</span>
                    <input
                      type="number"
                      step="1"
                      value={tempoInput}
                      onChange={(e) => setTempoInput(e.target.value)}
                      className={`border rounded-xl px-3 py-2 text-sm ${isPresencaInvalida ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </label>

                  {isPresencaInvalida && <p className="text-sm text-red-600">Os valores devem ser números positivos.</p>}

                  {configPresenca && (
                    <p className="text-xs text-gray-400">
                      Última atualização: {new Date(configPresenca.atualizadoEm).toLocaleString('pt-PT')}
                    </p>
                  )}

                  {erroConfig && <p className="text-sm text-red-600">{erroConfig}</p>}
                  {sucessoConfig && <p className="text-sm text-green-600">✓ Configuração guardada e enviada ao sensor.</p>}

                  <button
                    onClick={guardarPresenca}
                    disabled={btnPresencaDesativado}
                    className="py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    {aGuardar ? 'A guardar...' : 'Guardar e Enviar ao Sensor'}
                  </button>
                </div>
              )}

              {/* Se não tem parâmetros técnicos, avisa que não há mais opções */}
              {sensorSelecionado.tipoMetrica !== 'WEARABLE' && sensorSelecionado.tipoMetrica !== 'PRESENCA' && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Não existem parâmetros de calibração técnica para o tipo <strong>{TIPOS_LABEL[sensorSelecionado.tipoMetrica]}</strong>.
                </p>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}