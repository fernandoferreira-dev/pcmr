import { useState, useEffect, useRef } from "react";
import { Settings, Search, RefreshCw } from "lucide-react";

// Interfaces vindas do Código 2
interface SensorDTO {
  idSensor: number;
  nome: string;
  localizacao: string;
  estado: string; // 'ATIVO' | 'INATIVO'
}

interface EstadoSensorDTO {
  deviceId: string;
  online: boolean;
  ultimaLeitura: string | null;
  segundosDesdeUltimaLeitura: number;
}

type EstadoPing = "idle" | "a_testar" | "online" | "offline";

export default function DadosEquipamentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [equipamentos, setEquipamentos] = useState<SensorDTO[]>([]);
  
  // Controlar o estado de ping e detalhes para cada sensor utilizando o idSensor como chave
  const [estados, setEstados] = useState<Record<number, EstadoPing>>({});
  const [detalhes, setDetalhes] = useState<Record<number, EstadoSensorDTO>>({});
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Efeito de Busca com Debounce de 300ms (Funcionalidade do Código 2)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchTerm.trim()) {
      setEquipamentos([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetch(`/api/sensores/procurar?nome=${encodeURIComponent(searchTerm)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data: SensorDTO[]) => setEquipamentos(data))
        .catch(() => setEquipamentos([]));
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Testar Conexão Individual (Utilizando a API e o ID do Código 2)
  const testarConexao = async (idSensor: number) => {
    setEstados((prev) => ({ ...prev, [idSensor]: "a_testar" }));

    try {
      const res = await fetch(`/api/sensores/${idSensor}/ping`);
      if (!res.ok) {
        setEstados((prev) => ({ ...prev, [idSensor]: "offline" }));
        return;
      }

      const data: EstadoSensorDTO = await res.json();
      setDetalhes((prev) => ({ ...prev, [idSensor]: data }));
      setEstados((prev) => ({
        ...prev,
        [idSensor]: data.online ? "online" : "offline",
      }));
    } catch {
      setEstados((prev) => ({ ...prev, [idSensor]: "offline" }));
    }
  };

  // Disparar o ping para todos os sensores atualmente listados na tela
  const testarTodos = () => {
    equipamentos.forEach((item) => testarConexao(item.idSensor));
  };

  const getStatusColor = (estado: EstadoPing) => {
    switch (estado) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "a_testar":
        return "bg-yellow-500 animate-pulse";
      default:
        return "bg-gray-400";
    }
  };

  const getTempoRespostaLabel = (idSensor: number, estado: EstadoPing) => {
    if (estado === "a_testar") return "A testar...";
    if (estado === "idle" || estado === undefined) return "—";

    const detalhe = detalhes[idSensor];
    if (!detalhe) return "—";

    if (detalhe.segundosDesdeUltimaLeitura < 0) return "Sem leituras";
    return `${detalhe.segundosDesdeUltimaLeitura}s atrás`;
  };

  const getUltimaAtualizacaoLabel = (idSensor: number) => {
    const detalhe = detalhes[idSensor];
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
            className="p-2 hover:bg-white rounded-full transition-colors"
            title="Settings"
            aria-label="Connection settings"
          >
            <Settings size={20} className="text-gray-700" />
          </button>
        </div>

        <button
          onClick={testarTodos}
          disabled={equipamentos.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full shadow-sm transition-colors cursor-pointer"
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Localização
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Última Leitura
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Última Atualização
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {equipamentos.length > 0 ? (
              equipamentos.map((item) => {
                const estado = estados[item.idSensor] ?? "idle";
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
                      {item.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.localizacao || "Sem localização"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getTempoRespostaLabel(item.idSensor, estado)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getUltimaAtualizacaoLabel(item.idSensor)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => testarConexao(item.idSensor)}
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm.trim()
                    ? `Nenhum resultado encontrado para "${searchTerm}"`
                    : "Escreva algo na barra de pesquisa para buscar os equipamentos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}