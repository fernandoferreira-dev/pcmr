import React, { useState } from 'react'
import PaginaInicial from './pagina_inicial'

export default function App() {
  const [showPaginaInicial, setShowPaginaInicial] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (showPaginaInicial) return <PaginaInicial />

  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        // login successful
        setShowPaginaInicial(true)
      } else if (res.status === 401) {
        setError('Utilizador ou palavra-passe inválidos')
      } else if (res.status === 400) {
        setError('Preencha utilizador e palavra-passe')
      } else {
        const text = await res.text()
        setError(text || 'Erro no servidor')
      }
    } catch (e) {
      setError('Não foi possível contactar o servidor')
    } finally {
      setLoading(false)
    }
  }

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

            <label className="block text-1xl text-gray-600 mb-2">Utilizador</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mb-4 px-5 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Introduza o seu utilizador..."
            />

            <label className="block text-1xl text-gray-600 mb-2">Palavra-passe</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full mb-2 px-5 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Introduza a sua palavra-passe...."
            />

            <div className="text-right text-xs text-gray-500 mb-6">Esqueceu-se da palavra-passe?</div>

            {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-4 bg-green-200 hover:bg-green-300 disabled:opacity-60 text-gray-800 font-semibold py-3 rounded-full text-lg shadow-sm border border-[#6c757d]"
          >
            {loading ? 'A processar...' : 'ENTRAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
