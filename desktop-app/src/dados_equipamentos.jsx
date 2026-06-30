import React, { useState, useMemo } from 'react';
import { Settings, Search } from 'lucide-react';

export default function DadosEquipamentos() {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample diagnostic data
  const [diagnosticData] = useState([
    {
      
      id: 1,
      status: '???',
      nome: '???',
      tipo: '???',
      tempoResposta: '???',
      uptime: '???'
      
    }
  ]);

  const filteredData = useMemo(() => {
    return diagnosticData.filter(item =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, diagnosticData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="relative w-full h-full bg-[#EBEBEB] rounded-3xl p-8 shadow-inner flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Testar Conexão</h1>
          <button 
            className="p-2 hover:bg-white rounded-full transition-colors"
            title="Settings"
            aria-label="Connection settings"
          >
            <Settings size={20} className="text-gray-700" />
          </button>
        </div>
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
              <th className="w-12 px-4 py-3">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tempo de Resposta</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">UPTime</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr 
                  key={item.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.tipo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.tempoResposta}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.uptime}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  Nenhum resultado encontrado para "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
