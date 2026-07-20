import { useState, useEffect, useMemo } from "react";
import { Settings, Search, RefreshCw, Pencil, Check, X } from "lucide-react";
import ConfiguracoesModal from "./ConfiguracoesModal";

interface SensorNo {
  idSensor: number;
  nome: string;
  nomeExibicao: string | null;
  localizacao: string | null;
  tipo?: string;
  estado: string;
}

type EstadoPing = "idle" | "a_testar" | "online" | "offline";

interface EstadoSensor {
  online: boolean;
  ultimaLeitura: string | null;
  segundosDesdeUltimaLeitura: number;
}

export default function DadosEquipamentos({ userId }: { userId: number }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sensores, setSensores] = useState<SensorNo[]>([]);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [estados, setEstados] = useState<Record<string, EstadoPing>>({});
  const [detalhes, setDetalhes] = useState<Record<string, EstadoSensor>>({});

  const [idAEditar, setIdAEditar] = useState<number | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");
  const [aGuardarNome, setAGuardarNome] = useState(false);

  const carregarSensores = async () => {
    try {
      const res = await fetch("/api/sensores");
      if (!res.ok) return;
      const data: SensorNo[] = await res.json();
      setSensores(data);
    } catch {
    }
  };

  useEffect(() => {
    carregarSensores();
  }, []);

  const filteredData = useMemo(() => {
    return sensores.filter((item) => {
      const nomeMostrado = item.nomeExibicao || item.nome;
      return nomeMostrado.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, sensores]);

  const testarConexao = async (deviceId: string) => {
    setEstados((prev) => ({ ...prev, [deviceId]: "a_testar" }));

    try {
      const res = await fetch(`/api/sensores/${deviceId}/ping`);
      if (!res.ok) {
        setEstados((prev) => ({ ...prev, [deviceId]: "offline" }));
        return;
      }

      const data: EstadoSensor = await res.json();
      setDetalhes((prev) => ({ ...prev, [deviceId]: data }));
      setEstados((prev) => ({ ...prev, [deviceId]: data.online ? "online" : "offline" }));
    } catch {
      setEstados((prev) => ({ ...prev, [deviceId]: "offline" }));
    }
  };

  const testarTodos = () => {
    filteredData.forEach((item) => testarConexao(item.nome));
  };

  const iniciarEdicaoNome = (item: SensorNo, e: React.MouseEvent) => {
    e.stopPropagation();
    setIdAEditar(item.idSensor);
    setNomeEditando(item.nomeExibicao || "");
  };

  const cancelarEdicaoNome = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdAEditar(null);
    setNomeEditando("");
  };

  const guardarNomeExibicao = async (idSensor: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAGuardarNome(true);

    try {
      const res = await fetch(`/api/sensores/${idSensor}/nome-exibicao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeExibicao: nomeEditando }),
      });

      if (res.ok) {
        const atualizado: SensorNo = await res.json();
        setSensores((prev) =>
          prev.map((s) => (s.idSensor === idSensor ? { ...s, nomeExibicao: atualizado.nomeExibicao } : s))
        );
      }
    } catch {
      // falha silenciosa
    } finally {
      setAGuardarNome(false);
      setIdAEditar(null);
      setNomeEditando("");
    }
  };

  const getStatusColor = (estado: EstadoPing) => {
    switch (estado) {
      case "online": return "bg-green-500";
      case "offline": return "bg-red-500";
      case "a_testar": return "bg-yellow-500 animate-pulse";
      default: return "bg-gray-400";
    }
  };

  const getTempoRespostaLabel = (deviceId: string, estado: EstadoPing) => {
    if (estado === "a_testar") return "A testar...";
    if (estado === "idle" || estado === undefined) return "—";

    const detalhe = detalhes[deviceId];
    if (!detalhe) return "—";

    if (detalhe.segundosDesdeUltimaLeitura < 0) return "Sem leituras / atividade";
    return `${detalhe.segundosDesdeUltimaLeitura}s atrás`;
  };

  const getUltimaAtualizacaoLabel = (deviceId: string) => {
    const detalhe = detalhes[deviceId];
    if (!detalhe || !detalhe.ultimaLeitura) return "—";
    return new Date(detalhe.ultimaLeitura).toLocaleTimeString("pt-PT");
  };

  return (
    <div className="relative w-full h-full bg-[#EBEBEB] rounded-3xl p-8 shadow-inner flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">
            Testar Conexão
          </h1>
          <button
            onClick={() => setMostrarConfig(true)}
            className="p-2 hover:bg-white rounded-full transition-colors cursor-pointer"
            title="Definições"
            aria-label="Definições do sistema"
          >
            <Settings size={20} className="text-gray-700" />
          </button>
        </div>

        <button
          onClick={testarTodos}
          className="flex items-center gap-2 px-4 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] text-white text-sm font-medium rounded-full shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw size={16} />
          Testar Todos
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-text"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Localização</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Última Leitura</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Última Atualização</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const estado = estados[item.nome] ?? "idle";
                const aEditarEsteItem = idAEditar === item.idSensor;
                const nomeMostrado = item.nomeExibicao || item.nome;

                return (
                  <tr
                    key={item.idSensor}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(estado)}`}
                        title={
                          estado === "online" ? "Conectado" :
                          estado === "offline" ? "Sem resposta" :
                          estado === "a_testar" ? "A testar..." : "Não testado"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {aEditarEsteItem ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={nomeEditando}
                            onChange={(e) => setNomeEditando(e.target.value)}
                            placeholder={item.nome}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-40"
                          />
                          <button
                            onClick={(e) => guardarNomeExibicao(item.idSensor, e)}
                            disabled={aGuardarNome}
                            className="text-green-600 hover:text-green-800 cursor-pointer disabled:opacity-50"
                            title="Guardar"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={(e) => cancelarEdicaoNome(e)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <div className="flex flex-col">
                            <span className="font-medium">{nomeMostrado}</span>
                            {item.nomeExibicao && (
                              <span className="text-xs text-gray-400">{item.nome}</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => iniciarEdicaoNome(item, e)}
                            className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Editar nome de exibição"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.localizacao || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.tipo || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getTempoRespostaLabel(item.nome, estado)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getUltimaAtualizacaoLabel(item.nome)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => testarConexao(item.nome)}
                        disabled={estado === "a_testar"}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-gray-700 rounded-full transition-colors cursor-pointer"
                      >
                        {estado === "a_testar" ? "A testar..." : "Ping"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Nenhum resultado encontrado para "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Settings Modal */}
      {mostrarConfig && (
        <ConfiguracoesModal
          idUtilizador={userId}
          onClose={() => {
            setMostrarConfig(false);
            carregarSensores();
          }}
        />
      )}
    </div>
  );
}