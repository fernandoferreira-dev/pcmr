import React, { useState } from 'react';
import enviar from "./assets/imagens/transferir.png"; // Importado como 'enviar'

export default function Comunicacao() {
  const [termoPesquisa, setTermoPesquisa] = useState('');

  const dadosComunicacoes = [
    { id: 1, nome: 'Ana Silva', dataHora: '29 Jun 10:30', assunto: 'Atualização do Projeto', lida: false },
    //{ id: 2, nome: 'Carlos Mendes', dataHora: '28 Jun 15:45', assunto: 'Dúvida sobre o design', lida: true },
    //{ id: 3, nome: 'Beatriz Costa', dataHora: '27 Jun 09:00', assunto: 'Reunião de Alinhamento', lida: false },
  ];

  // Filtro para a barra de pesquisa
  const comunicacoesFiltradas = dadosComunicacoes.filter((item) =>
    item.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  return (
    <div className="relative w-full h-full bg-[#EBEBEB] rounded-[2rem] p-6 shadow-inner flex flex-col overflow-hidden">
      
      {/* Barra de Pesquisa */}
      <div className="mb-6 shrink-0 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* Ícone de Lupa */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Pesquisar por nome..." 
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AAB99F] shadow-sm text-gray-700 bg-white"
          />
        </div>
      </div>

      {/* Lista de Comunicações Dinâmica */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
        {comunicacoesFiltradas.length > 0 ? (
          comunicacoesFiltradas.map((comunicacao) => (
            <div key={comunicacao.id} className="border border-gray-400 rounded-2xl overflow-hidden shadow-sm bg-white shrink-0 transition-transform hover:scale-[1.01]">
              
              {/* Cabeçalho da Notificação */}
              <div className="bg-[#AAB99F] px-4 py-2 flex justify-between items-center border-b border-gray-400">
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-300 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <span className="font-bold text-gray-800">{comunicacao.nome}</span>
                </div>
                <span className="text-sm text-gray-700 font-medium">{comunicacao.dataHora}</span>
              </div>
              
              {/* Corpo da Notificação */}
              <div className="px-4 py-5 flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Assunto: {comunicacao.assunto}</span>
                
                {/* Indicador de Estado*/}
                {!comunicacao.lida && (
                  <div className="w-6 h-6 bg-red-600 rounded-full shadow-sm border border-gray-300" title="Mensagem não lida"></div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center mt-10">Nenhuma comunicação encontrada.</p>
        )}
      </div>

      {/*(Avião de Papel) */}
      <button
        className="absolute bottom-6 right-6 w-11 h-11 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-10 cursor-pointer"
        title="Nova Mensagem"
      >
        <img
          src={enviar}
          alt="Nova Mensagem"
          className="w-12 h-12 object-contain"
        />
      </button>
    </div>
  );
}