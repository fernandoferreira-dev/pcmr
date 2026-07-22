import { useEffect, useState } from "react";
import PaginaInicial from "./pagina_inicial";
import { useBiometriaLogin } from "./hooks/useBiometria";
import { useTranslation } from "react-i18next";

const AUTH_SESSION_KEY = "pcmr-auth-session";
const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000;

const viewImg = new URL("./assets/imagens/view.png", import.meta.url).href;
const hideImg = new URL("./assets/imagens/hide.png", import.meta.url).href;

type AuthSession = {
  userName: string;
  userId: number;
  tipo: string;
  expiresAt: number;
};

function loadStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) return null;

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<AuthSession>;
    if (
      typeof parsedSession.userName !== "string" ||
      typeof parsedSession.userId !== "number" ||
      typeof parsedSession.tipo !== "string" ||
      typeof parsedSession.expiresAt !== "number" ||
      parsedSession.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }

    return {
      userName: parsedSession.userName,
      userId: parsedSession.userId,
      tipo: parsedSession.tipo,
      expiresAt: parsedSession.expiresAt,
    };
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadStoredSession(),
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Estados do Modal de Criar Médico
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoUsername, setNovoUsername] = useState("");
  const [novaPassword, setNovaPassword] = useState("");
  const [modalStatus, setModalStatus] = useState<{ tipo: 'erro' | 'sucesso', msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();

  const {
    status: bioStatus,
    mensagem: bioMensagem,
    userData: bioUserData,
    iniciarLoginBiometria: bioLogin,
    cancelar: bioCancelar,
  } = useBiometriaLogin();

  useEffect(() => {
    if (bioStatus === "sucesso" && bioUserData) {
      const dadosBiometria = bioUserData as Record<string, any>;

      const nextSession: AuthSession = {
        userName: dadosBiometria.nome,
        userId: dadosBiometria.userId,
        tipo: dadosBiometria.tipo || "Médico",
        expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
      };
      window.localStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify(nextSession),
      );
      setSession(nextSession);
    }
  }, [bioStatus, bioUserData]);

  useEffect(() => {
    if (!session) return;

    const msUntilExpiry = session.expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      setSession(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      setSession(null);
    }, msUntilExpiry);

    return () => window.clearTimeout(timeoutId);
  }, [session]);

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    setSession(null);
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError(null);
    setUsernameError(false);
    setPasswordError(false);
  };

  if (session)
    return (
      <PaginaInicial
        userName={session.userName}
        userId={session.userId}
        tipo={session.tipo}
        onLogout={handleLogout}
      />
    );

  const handleLogin = async () => {
    setError(null);

    const missingUsername = !username.trim();
    const missingPassword = !password.trim();

    setUsernameError(missingUsername);
    setPasswordError(missingPassword);

    if (missingUsername || missingPassword) {
      if (missingUsername && missingPassword)
        setError("Preencha utilizador e palavra-passe");
      else if (missingUsername) setError("Preencha o Utilizador!");
      else setError("Preencha a Password!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        let userName = username.trim();
        const contentType = res.headers.get("content-type") || "";

        let userId = 0;
        let tipo = "Desconhecido";

        if (contentType.includes("application/json")) {
          const data = (await res.json()) as { nome?: string; userId?: number; tipo?: string };
          if (typeof data.nome === "string" && data.nome.trim()) {
            userName = data.nome.trim();
          }
          if (typeof data.userId === "number" && data.userId > 0) {
            userId = data.userId;
          }
          if (typeof data.tipo === "string" && data.tipo.trim()) {
            tipo = data.tipo.trim();
          }
        }

        const nextSession = {
          userName,
          userId,
          tipo,
          expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
        };

        window.localStorage.setItem(
          AUTH_SESSION_KEY,
          JSON.stringify(nextSession),
        );
        setSession(nextSession);
      } else if (res.status === 401) {
        setError("Utilizador e palavra-passe incorretos");
        setUsername("");
        setPassword("");
        setUsernameError(true);
        setPasswordError(true);
      } else if (res.status === 400) {
        setError("Preencha utilizador e palavra-passe");
      } else {
        const text = await res.text();
        setError(text || "Erro no servidor");
      }
    } catch {
      setError("Não foi possível contactar o servidor");
    } finally {
      setLoading(false);
    }
  };

  const solicitarCriacaoMedico = async () => {
    setModalStatus(null);
    if (!novoNome || !novoEmail || !novoUsername || !novaPassword) {
      setModalStatus({ tipo: 'erro', msg: 'Todos os campos são obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registo/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
          username: novoUsername,
          password: novaPassword
        }),
      });

      if (res.ok) {
        setModalStatus({ tipo: 'sucesso', msg: 'Pedido enviado! Espere que o Administrador aceite o seu pedido!' });
        setNovoNome("");
        setNovoEmail("");
        setNovoUsername("");
        setNovaPassword("");
        setTimeout(() => setIsModalOpen(false), 3000);
      } else {
        const data = await res.json();
        setModalStatus({ tipo: 'erro', msg: data.erro || "Erro ao solicitar criação." });
      }
    } catch {
      setModalStatus({ tipo: 'erro', msg: 'Falha de comunicação com o servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 relative">
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-5 sm:p-7 flex flex-col md:flex-row gap-6 items-stretch">

          <div className="hidden md:flex flex-1 bg-green-100 rounded-2xl p-3">
            <div className="w-full h-full rounded-xl bg-white shadow-inner overflow-hidden flex items-center justify-center min-h-[350px]">
              <img src="https://www.medikal.net/images/altkategori/mobil-ekg-monitorleri.jpg" alt="monitor" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="w-full md:w-96 bg-white rounded-xl flex flex-col justify-center py-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-5 text-center">{t('login.loginAppName')}</h2>

              <label className="block text-sm sm:text-base text-gray-600 mb-1">{t('login.loginUsername')}</label>
              <div className="relative mb-4">
                <input
                  value={username}
                  disabled={loading || bioStatus === "aguardar_dedo" || bioStatus === "a_processar"}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError || passwordError) {
                      setUsernameError(false);
                      setPasswordError(false);
                    }
                    if (error) setError(null);
                  }}
                  className={`w-full mb-0 pl-4 pr-4 py-3 bg-gray-100 placeholder-gray-500 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${usernameError ? "ring-4 ring-red-500 border-red-500" : "border border-transparent"
                    }`}
                  placeholder={t('login.loginUsernamePlaceholder')}
                />
              </div>

              <label className="block text-sm sm:text-base text-gray-600 mb-1">{t('login.loginPassword')}</label>
              <div className="relative mb-2">
                <input
                  value={password}
                  disabled={loading || bioStatus === "aguardar_dedo" || bioStatus === "a_processar"}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (usernameError || passwordError) {
                      setUsernameError(false);
                      setPasswordError(false);
                    }
                    if (error) setError(null);
                  }}
                  type={showPassword ? "text" : "password"}
                  className={`w-full mb-0 pl-4 pr-12 py-3 bg-gray-100 placeholder-gray-500 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${passwordError ? "ring-4 ring-red-500 border-red-500" : "border border-transparent"
                    }`}
                  placeholder={t('login.loginPasswordPlaceholder')}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600 cursor-pointer"
                >
                  <img
                    src={showPassword ? hideImg : viewImg}
                    alt={showPassword ? t('login.loginHidePassword') : t('login.loginShowPassword')}
                    className="h-5 w-5"
                  />
                </button>
              </div>

              <div className="text-right text-xs text-gray-500 mb-2 hover:text-green-600 cursor-pointer">
                {t('login.loginForgotPassword')}
              </div>

              <div className="flex flex-col mb-3">
                {/* Espaço fixo reservado para o erro (evita que os botões saltem) */}
                <div className="h-6 flex items-center">
                  <div
                    className={`text-sm text-red-600 font-medium transition-opacity duration-200 ${error ? "opacity-100" : "opacity-0 select-none pointer-events-none"
                      }`}
                  >
                    {error || "Espaço reservado"}
                  </div>
                </div>

                {/* Bloco da biometria com transição suave de deslize e opacidade */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${bioStatus !== "idle"
                    ? "max-h-24 opacity-100 mt-1"
                    : "max-h-0 opacity-0 mt-0 pointer-events-none"
                    }`}
                >
                  <div className={`text-xs p-2.5 rounded-xl ${bioStatus === "aguardar_dedo" || bioStatus === "a_processar"
                    ? "bg-blue-50 text-blue-700"
                    : bioStatus === "sucesso"
                      ? "bg-green-50 text-green-700"
                      : bioStatus === "timeout"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                    {bioMensagem}
                    {(bioStatus === "aguardar_dedo" || bioStatus === "a_processar") && (
                      <button
                        onClick={bioCancelar}
                        className="ml-2 text-xs font-semibold underline hover:no-underline cursor-pointer"
                      >
                        {t('login.loginCancel')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleLogin} disabled={loading || bioStatus === "aguardar_dedo" || bioStatus === "a_processar"} className="text-white font-semibold py-3.5 rounded-full text-base shadow-md w-full bg-linear-to-r from-green-400 to-green-600 hover:from-green-200 hover:to-green-500 hover:brightness-110 transition-all cursor-pointer">
                {loading ? t('login.loginProcessing') : t('login.loginEnter')}
              </button>

              <button onClick={bioLogin} disabled={loading || bioStatus === "aguardar_dedo" || bioStatus === "a_processar"} className="text-white font-semibold py-3.5 rounded-full text-base shadow-md w-full bg-linear-to-r from-emerald-500 to-teal-600 flex items-center justify-center gap-2 hover:from-emerald-300 hover:to-teal-500 hover:brightness-110 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10" /><path d="M5 12C5 8.1 8.1 5 12 5s7 3.1 7 7" /><path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" /><circle cx="12" cy="12" r="2" /><path d="M2 12h20" /></svg>
                {t('login.loginFingerprint')}
              </button>

              {/* Botão Mini para criar Médico */}
              <div className="text-center mt-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm font-medium text-green-600 hover:text-green-800 underline transition-colors cursor-pointer"
                >
                  {t('login.loginRequestDoctorAccount')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Registo */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-gray-800">{t('login.loginNewDoctorAccount')}</h3>
            <p className="text-sm text-gray-600">{t('login.loginDoctorAccountInfo')}</p>

            <input
              className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder={t('login.loginFullName')}
              value={novoNome} onChange={e => setNovoNome(e.target.value)}
            />
            <input
              className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder={t('login.loginEmail')}
              type="email"
              value={novoEmail} onChange={e => setNovoEmail(e.target.value)}
            />
            <input
              className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder={t('login.loginNewUsername')}
              value={novoUsername} onChange={e => setNovoUsername(e.target.value)}
            />
            <input
              className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder={t('login.loginNewPassword')}
              type="password"
              value={novaPassword} onChange={e => setNovaPassword(e.target.value)}
            />

            {modalStatus && (
              <div className={`text-sm p-2 rounded ${modalStatus.tipo === 'erro' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {modalStatus.msg}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 rounded-lg font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
              >
                {t('login.loginCancel')}
              </button>
              <button
                onClick={solicitarCriacaoMedico}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-lg font-medium text-white bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? t('login.loginSending') : t('login.loginSendRequest')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}