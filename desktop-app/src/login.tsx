import React, { useEffect, useState } from 'react'
import PaginaInicial from './pagina_inicial'
import viewImg from './assets/imagens/view.png'
import hideImg from './assets/imagens/hide.png'

const AUTH_SESSION_KEY = 'pcmr-auth-session'
const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000

type AuthSession = {
  userName: string
  expiresAt: number
}

function loadStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY)
  if (!rawSession) return null

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<AuthSession>
    if (
      typeof parsedSession.userName !== 'string' ||
      typeof parsedSession.expiresAt !== 'number' ||
      parsedSession.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(AUTH_SESSION_KEY)
      return null
    }

    return {
      userName: parsedSession.userName,
      expiresAt: parsedSession.expiresAt,
    }
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadStoredSession())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  useEffect(() => {
    if (!session) return

    const msUntilExpiry = session.expiresAt - Date.now()
    if (msUntilExpiry <= 0) {
      window.localStorage.removeItem(AUTH_SESSION_KEY)
      setSession(null)
      return
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.removeItem(AUTH_SESSION_KEY)
      setSession(null)
    }, msUntilExpiry)

    return () => window.clearTimeout(timeoutId)
  }, [session])

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_SESSION_KEY)
    setSession(null)
    setUsername('')
    setPassword('')
    setShowPassword(false)
    setError(null)
    setUsernameError(false)
    setPasswordError(false)
  }

  if (session) return <PaginaInicial userName={session.userName} onLogout={handleLogout} />

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
        let userName = username.trim()
        const contentType = res.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          const data = (await res.json()) as { nome?: string }
          if (typeof data.nome === 'string' && data.nome.trim()) {
            userName = data.nome.trim()
          }
        }

        const nextSession = {
          userName,
          expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
        }

        window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession))
        setSession(nextSession)
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

  const handleLoginTeste = () => {
    const testSession = {
      userName: 'Utilizador Teste',
      expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
    }
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(testSession))
    setSession(testSession)
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
                <img
                  src={showPassword ? hideImg : viewImg}
                  alt={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                  className="h-5 w-5"
                />
              </button>
            </div>

            <div className="text-right text-xs text-gray-500 mb-6">Esqueceu-se da palavra-passe?</div>

            {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
          </div>

          <button
            onClick={handleLoginTeste} //handleLogin
            disabled={loading}//disabled={loading}
            className="mt-4 cursor-pointer disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg shadow-md w-full bg-gradient-to-r from-green-400 to-green-600"
          >
            {loading ? 'A processar...' : 'ENTRAR'}
          </button>
          
          <button
            onClick={handleLoginTeste}
            disabled={loading}
            className="mt-4 cursor-pointer disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg shadow-md w-full bg-gradient-to-r from-green-400 to-green-600"
          >
            Entrar (Teste)
          </button>
        </div>
        </div>

        <footer className="w-full max-w-6xl mt-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} Diogo Rocha - Fernando Ferreira - Jaime Quaresma - João Santos.</footer>
      </div>
    </div>
  )
}
