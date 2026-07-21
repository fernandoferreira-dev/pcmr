import { useEffect, useState } from "react";
import LoginPage, { type PacienteSession } from "./pages/login-page";
import DiagnosticosPage from "./pages/diagnosticos-page.tsx";
import MensagensPage from "./pages/mensagens-page";
import { NavBar, type PacienteView } from "./components";
import "./assets/styles/index.css";

const SESSION_KEY = "paciente-auth-session";

function carregarSessao(): PacienteSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as PacienteSession;
        if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return parsed;
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

function App() {
    const [sessao, setSessao] = useState<PacienteSession | null>(() => carregarSessao());
    const [view, setView] = useState<PacienteView>("diagnosticos");

    useEffect(() => {
        if (!sessao) return;

        const expirar = () => {
            localStorage.removeItem(SESSION_KEY);
            setSessao(null);
        };

        const restante = sessao.expiresAt - Date.now();
        const timeout = window.setTimeout(expirar, Math.max(restante, 0));

        return () => window.clearTimeout(timeout);
    }, [sessao]);

    if (!sessao) {
        return <LoginPage onLogin={setSessao} />;
    }

    return (
        <>
            {view === "diagnosticos" && <DiagnosticosPage idPessoa={sessao.idPessoa} />}
            {view === "mensagens" && <MensagensPage userId={sessao.userId} />}
            <NavBar active={view} onNavigate={setView} />
        </>
    );
}

export default App;