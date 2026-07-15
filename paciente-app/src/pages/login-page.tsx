import { useState } from "react";
import logo from "../assets/images/logo.png";
import "../assets/styles/index.css";

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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    codigo: codigo.trim(),
                }),
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
        <section className="flex min-h-screen bg-background font-sans">
            <main className="flex-1 flex items-center justify-center p-6 w-full max-w-md mx-auto">
                <div className="bg-background rounded-2xl shadow-xl p-8 w-full border-t-8 border-primary">
                    <div className="flex justify-center mb-8">
                        <img
                            src={logo}
                            alt="MedyCist"
                            className="w-90 h-90 object-contain"
                        />
                    </div>

                    <p className="text-sm text-center text-muted mb-6 border-b pb-4">
                        Introduza o código de acesso fornecido pelo seu médico.
                    </p>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-text">
                                Código de Acesso
                            </label>

                            <input
                                value={codigo}
                                onChange={(e) => {
                                    setCodigo(e.target.value);
                                    if (erro) setErro(null);
                                }}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleEntrar()
                                }
                                placeholder="Código de acesso"
                                className="
                                    w-full
                                    px-4 py-3
                                    rounded-lg
                                    border-2 border-primary-outline
                                    bg-background
                                    text-text
                                    focus:border-primary
                                    focus:outline-none
                                    transition-colors
                                    text-center
                                    text-2xl
                                    tracking-widest
                                "
                            />
                        </div>

                        {erro && (
                            <div className="text-center text-red-600 bg-red-100 p-3 rounded-lg text-sm font-semibold">
                                {erro}
                            </div>
                        )}

                        <button
                            onClick={handleEntrar}
                            disabled={aEntrar}
                            className="
                                w-full
                                py-4
                                bg-text
                                text-background
                                font-bold
                                rounded-xl
                                uppercase
                                tracking-widest
                                hover:bg-primary
                                hover:shadow-xl
                                active:scale-95
                                transition-all
                                duration-300
                                shadow-md
                                disabled:opacity-50
                            "
                        >
                            {aEntrar ? "A validar..." : "Entrar"}
                        </button>
                    </div>
                </div>
            </main>
        </section>
    );
}

export default LoginPage;