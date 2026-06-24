import React, { useState } from 'react'
import PaginaInicial from './pagina_inicial'

export default function App() {
  const [showPaginaInicial, setShowPaginaInicial] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  if (showPaginaInicial) return <PaginaInicial />

  const handleLogin = async () => {
    setError(null)

    const missingUsername = !username.trim()
    const missingPassword = !password.trim()

    setUsernameError(missingUsername)
    setPasswordError(missingPassword)

    if (missingUsername || missingPassword) {
      if (missingUsername && missingPassword) setError('Preencha utilizador e palavra-passe')
      else if (missingUsername) setError('Preencha o Utilizador!')
      else setError('Preencha a Password!')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        setShowPaginaInicial(true)
      } else if (res.status === 401) {
        setError('Utilizador e palavra-passe incorretos')
        setUsername('')
        setPassword('')
        setUsernameError(true)
        setPasswordError(true)
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
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6">
        {/* Esquerda */}
        <div className="hidden md:flex flex-1 bg-green-100 rounded-xl p-6 items-center justify-center">
          <div
            className="w-full h-48 sm:h-72 md:h-96 rounded-2xl bg-white shadow-inner overflow-hidden flex items-center justify-center"
            style={{ filter: 'brightness(1.03) saturate(1.08) sepia(0.04)' }}
          >
            <img
              src="https://www.medikal.net/images/altkategori/mobil-ekg-monitorleri.jpg"
              alt="monitor"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Direita*/}
        <div className="w-full md:w-96 bg-white rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 text-center">MedyCist</h2>

            <label className="block text-base sm:text-lg text-gray-600 mb-2">Utilizador</label>
            <div className="relative mb-4">

              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (usernameError || passwordError) {
                    setUsernameError(false)
                    setPasswordError(false)
                  }
                  if (error) setError(null)
                }}
                className={
                  `w-full mb-0 pl-4 pr-4 py-3 bg-gray-100 placeholder-gray-500 text-gray-700 rounded-xl focus:outline-none ` +
                  `focus:ring-2 focus:ring-green-300 ` +
                  (usernameError ? 'ring-4 ring-red-500 border-red-500' : 'border border-transparent')
                }
                placeholder="Introduza o seu utilizador..."
              />
            </div>

            <label className="block text-base sm:text-lg text-gray-600 mb-2">Palavra-passe</label>
            <div className="relative mb-2">

              <input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (usernameError || passwordError) {
                    setUsernameError(false)
                    setPasswordError(false)
                  }
                  if (error) setError(null)
                }}
                type={showPassword ? 'text' : 'password'}
                className={
                  `w-full mb-0 pl-4 pr-12 py-3 bg-gray-100 placeholder-gray-500 text-gray-700 rounded-xl focus:outline-none ` +
                  `focus:ring-2 focus:ring-green-300 ` +
                  (passwordError ? 'ring-4 ring-red-500 border-red-500' : 'border border-transparent')
                }
                placeholder="Introduza a sua palavra-passe...."
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg xmlns="" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3.172 3.172a4 4 0 015.656 0L10 4.343l1.172-1.171a4 4 0 115.656 5.656L10 16.828 3.172 10 3.172 3.172z" />
                  </svg>
                ) : (
                  <svg xmlns="" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.458 12C3.732 7.943 7.522 5 10 5c2.478 0 6.268 2.943 7.542 7-.653 1.97-2.02 3.613-3.682 4.61L10 18l-5.86-1.39C4.478 15.613 3.11 13.97 2.458 12z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-right text-xs text-gray-500 mb-6">Esqueceu-se da palavra-passe?</div>

            {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-4 disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg shadow-lg w-full bg-gradient-to-r from-green-400 to-green-600"
          >
            {loading ? 'A processar...' : 'ENTRAR'}
          </button>
        </div>
        </div>

        <footer className="w-full max-w-6xl mt-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} Diogo Rocha - Fernando Ferreira - Jaime Quaresma - João Santos.</footer>
      </div>
    </div>
  )
}
