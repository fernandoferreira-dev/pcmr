import { useState } from "react";
import "../assets/styles/index.css";
import { Button } from "../components";

const SESSION_KEY = "paciente-auth-session";
const SESSION_DURATION_MS = 60 * 60 * 1000;

export type PacienteSession = {
    userId: number;
    idPessoa: number;
    nome: string;
    expiresAt: number;
};

type Props = {
    onLogin: (session: PacienteSession) => void;
};

function LoginPage({ onLogin }: Props) {
    const [codigo, setCodigo] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [aEntrar, setAEntrar] = useState(false);

    const handleEntrar = async () => {
        if (!codigo.trim()) {
            setErro("Introduza o código de acesso");
            return;
        }

        setAEntrar(true);
        setErro(null);

        try {
            const res = await fetch("/api/pacientes/acesso/validar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigo: codigo.trim() }),
            });

            if (!res.ok) {
                setErro("Código inválido ou expirado");
                return;
            }

            const data = await res.json();
            const session: PacienteSession = {
                userId: data.userId,
                idPessoa: data.idPessoa,
                nome: data.nome ?? "Paciente",
                expiresAt: Date.now() + SESSION_DURATION_MS,
            };

            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            onLogin(session);
        } catch {
            setErro("Erro de comunicação com o servidor");
        } finally {
            setAEntrar(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center font-sans p-4">
            <div className="border border-primary-outline rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4 shadow-sm bg-background">
                <h1 className="text-text text-2xl font-semibold text-center">MedyCist</h1>
                <p className="text-muted text-sm text-center">
                    Introduza o código de acesso fornecido pelo seu médico
                </p>

                <input
                    value={codigo}
                    onChange={(e) => {
                        setCodigo(e.target.value);
                        if (erro) setErro(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleEntrar()}
                    placeholder="Código de acesso"
                    className="w-full text-center tracking-widest text-lg px-4 py-3 rounded-xl border border-primary-outline bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-text"
                />

                {erro && <p className="text-sm text-center text-red-600">{erro}</p>}

                <Button onClick={handleEntrar} disabled={aEntrar}>
                    {aEntrar ? "A validar..." : "Entrar"}
                </Button>
            </div>
        </div>
    );
}

export default LoginPage;