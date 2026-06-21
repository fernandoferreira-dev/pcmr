import React, { useState } from 'react'
import PaginaInicial from './pagina_inicial'

export default function App() {
  const [showPaginaInicial, setShowPaginaInicial] = useState(false)

  if (showPaginaInicial) return <PaginaInicial />

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-6 flex gap-6">
        {/* Painel à Esquerda */}
        <div className="flex-1 bg-green-100 rounded-xl p-6 flex items-center justify-center">
          <div className="w-full h-90 rounded-2xl bg-white shadow-inner overflow-hidden flex items-center justify-center">
            <img
              src="https://www.medikal.net/images/altkategori/mobil-ekg-monitorleri.jpg"
              alt="monitor"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Painel à direita */}
        <div className="w-96 bg-white rounded-xl p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-700 mb-7 text-center">MedyCist</h2>

            <label className="block text-sm text-gray-600 mb-2">Utilizador</label>
            <input
              className="w-full mb-4 px-4 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Introduza o seu utilizador..."
            />

            <label className="block text-sm text-gray-600 mb-2">Palavra-passe</label>
            <input
              type="Palavra-passe"
              className="w-full mb-2 px-4 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Introduza a sua palavra-passe...."
            />

            <div className="text-right text-xs text-gray-500 mb-6">Esqueceu-se da palavra-passe?</div>
          </div>

          <button
            onClick={() => setShowPaginaInicial(true)}
            className="mt-4 bg-green-200 hover:bg-green-300 text-gray-800 font-semibold py-3 rounded-full text-lg shadow-sm border border-[#6c757d]"
          >
            ENTRAR
          </button>
        </div>
      </div>
    </div>
  )
}
