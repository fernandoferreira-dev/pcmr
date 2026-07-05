import { useEffect, useState } from 'react'
import PaginaInicial from './pagina_inicial'
import { useBiometriaLogin } from './hooks/useBiometria'

const AUTH_SESSION_KEY = 'pcmr-auth-session'
const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000

const viewImg = new URL('./assets/imagens/view.png', import.meta.url).href
const hideImg = new URL('./assets/imagens/hide.png', import.meta.url).href

type AuthSession = {
  userName: string
  userId: number
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
      typeof parsedSession.userId !== 'number' ||
      typeof parsedSession.expiresAt !== 'number' ||
      parsedSession.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(AUTH_SESSION_KEY)
      return null
    }

    return {
      userName: parsedSession.userName,
      userId: parsedSession.userId,
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

  const {
    status: bioStatus,
    mensagem: bioMensagem,
    userData: bioUserData,
    iniciarLoginBiometria: bioLogin,
    cancelar: bioCancelar,
  } = useBiometriaLogin()

  // Quando o login biométrico é bem-sucedido, cria sessão
  useEffect(() => {
    if (bioStatus === 'sucesso' && bioUserData) {
      const nextSession: AuthSession = {
        userName: bioUserData.nome,
        userId: bioUserData.userId,
        expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
      }
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(nextSession)
    }
  }, [bioStatus, bioUserData])

  useEffect(() => {
    if (!session) return

    const msUntilExpiry = session.expiresAt - Date.now()
    if (msUntilExpiry <= 0) {
      window.localStorage.removeItem(AUTH_SESSION_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  if (session) return <PaginaInicial userName={session.userName} userId={session.userId} onLogout={handleLogout} />

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

        let userId = 0
        if (contentType.includes('application/json')) {
          const data = (await res.json()) as { nome?: string; userId?: number }
          if (typeof data.nome === 'string' && data.nome.trim()) {
            userName = data.nome.trim()
          }
          if (typeof data.userId === 'number' && data.userId > 0) {
            userId = data.userId
          }
        }

        const nextSession = {
          userName,
          userId,
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
    } catch {
      setError('Não foi possível contactar o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginTeste = () => {
    const testSession = {
      userName: 'Utilizador Teste',
      userId: 1,
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

        {/* Direita */}
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

            <div className="text-right text-xs text-gray-500 mb-4">Esqueceu-se da palavra-passe?</div>

            <div className="mb-4 min-h-24 flex flex-col gap-3">
              <div className="min-h-5 text-sm text-red-600">
                {error ?? <span className="invisible">placeholder</span>}
              </div>

              {/* Mensagem biométrica */}
              {bioStatus !== 'idle' && (
                <div className={`text-sm p-3 rounded-xl ${
                  bioStatus === 'aguardar_dedo' || bioStatus === 'a_processar'
                    ? 'bg-blue-50 text-blue-700'
                    : bioStatus === 'sucesso'
                    ? 'bg-green-50 text-green-700'
                    : bioStatus === 'timeout'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {bioMensagem}
                  {(bioStatus === 'aguardar_dedo' || bioStatus === 'a_processar') && (
                    <button
                      onClick={bioCancelar}
                      className="ml-2 text-xs underline hover:no-underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || bioStatus === 'aguardar_dedo' || bioStatus === 'a_processar'}
            className="mt-4 cursor-pointer disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg shadow-md w-full bg-linear-to-r from-green-400 to-green-600 transition-all duration-200 ease-out hover:from-green-200 hover:to-green-500 hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5"
          >
            {loading ? 'A processar...' : 'ENTRAR'}
          </button>

          {/* Botão de Impressão Digital */}
          <button
            onClick={bioLogin}
            disabled={loading || bioStatus === 'aguardar_dedo' || bioStatus === 'a_processar'}
            className="mt-3 cursor-pointer disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg shadow-md w-full bg-linear-to-r from-emerald-500 to-teal-600 flex items-center justify-center gap-2 transition-all duration-200 ease-out hover:from-emerald-300 hover:to-teal-500 hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10" />
              <path d="M5 12C5 8.1 8.1 5 12 5s7 3.1 7 7" />
              <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
              <circle cx="12" cy="12" r="2" />
              <path d="M2 12h20" />
            </svg>
            Entrar com Impressão Digital
          </button>
          
          <button
            onClick={handleLoginTeste}
            disabled={loading || bioStatus === 'aguardar_dedo' || bioStatus === 'a_processar'}
            className="mt-3 cursor-pointer disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg shadow-md w-full bg-linear-to-r from-green-400 to-green-600 transition-all duration-200 ease-out hover:from-green-200 hover:to-green-500 hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5"
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

