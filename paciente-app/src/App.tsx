import { useState, useEffect } from "react";
import DiagnosticosPage from "./pages/diagnosticos-page";
import MensagensPage from "./pages/mensagens-page";
import DefinicoesPage from "./pages/definicoes-page";
import LoginPage from "./pages/login-page";
import type { PacienteSession } from "./pages/login-page";
import { Navbar } from "./components/navbar";
import type { TabNavegacao } from "./components/navbar";
import { AppProvider } from "./context/AppContext";

const SESSION_KEY = "paciente-auth-session";

function MainContent() {
    // Estado para guardar a sessão do utilizador
    const [sessao, setSessao] = useState<PacienteSession | null>(() => {
        const guardada = localStorage.getItem(SESSION_KEY);
        if (!guardada) return null;
        try {
            const parsed: PacienteSession = JSON.parse(guardada);
            if (parsed.expiresAt < Date.now()) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    });

    const [abaAtiva, setAbaAtiva] = useState<TabNavegacao>(() => {
        const abaGuardada = localStorage.getItem("app_aba_ativa") as TabNavegacao | null;
        return abaGuardada ?? "diagnosticos";
    });

    useEffect(() => {
        localStorage.setItem("app_aba_ativa", abaAtiva);
    }, [abaAtiva]);

    // Função para efetuar Logout
    const handleLogout = () => {
        localStorage.removeItem(SESSION_KEY);
        setSessao(null);
    };

    // Se não houver sessão ativa, mostra a página de Login
    if (!sessao) {
        return <LoginPage onLogin={(novaSessao) => setSessao(novaSessao)} />;
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans antialiased">
            <main className="transition-all duration-200">
                {abaAtiva === "diagnosticos" && <DiagnosticosPage idPessoa={sessao.idPessoa} />}
                {abaAtiva === "mensagens" && <MensagensPage userId={sessao.userId} />}
                {abaAtiva === "definicoes" && <DefinicoesPage onLogout={handleLogout} />}
            </main>

            <Navbar abaAtiva={abaAtiva} aoMudarAba={setAbaAtiva} />
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <MainContent />
        </AppProvider>
    );
}