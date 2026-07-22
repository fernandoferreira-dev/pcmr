import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import logo from "../assets/images/logo.png";
import "../assets/styles/index.css";

const SESSION_KEY = "paciente-auth-session";
const SESSION_DURATION_MS = 60 * 60 * 1000;
const CODIGO_LENGTH = 6;

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
    const { t } = useApp();
    const [codigo, setCodigo] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [aEntrar, setAEntrar] = useState(false);
    const submetidoRef = useRef(false);

    const handleCodigoChange = (valor: string) => {
        const apenasDigitos = valor.replace(/\D/g, "").slice(0, CODIGO_LENGTH);
        setCodigo(apenasDigitos);
        if (erro) setErro(null);
        submetidoRef.current = false;
    };

    const handleEntrar = async () => {
        if (codigo.length !== CODIGO_LENGTH) {
            setErro(
                t(
                    `O código tem de ter ${CODIGO_LENGTH} dígitos`,
                    `The code must be ${CODIGO_LENGTH} digits long`
                )
            );
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
                    codigo,
                }),
            });

            if (!res.ok) {
                setErro(t("Código inválido ou expirado", "Invalid or expired code"));
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
            setErro(
                t(
                    "Erro de comunicação com o servidor",
                    "Communication error with the server"
                )
            );
        } finally {
            setAEntrar(false);
        }
    };

    // Submete automaticamente assim que o código atinge os 6 dígitos
    useEffect(() => {
        if (codigo.length === CODIGO_LENGTH && !aEntrar && !submetidoRef.current) {
            submetidoRef.current = true;
            handleEntrar();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codigo]);

    return (
        <section className="flex min-h-screen bg-background font-sans text-text select-none">
            <main className="flex-1 flex items-center justify-center p-6 w-full max-w-md mx-auto">
                <div className="bg-background rounded-2xl shadow-xl p-8 w-full border-t-8 border-primary border border-primary-outline/30">
                    <div className="flex justify-center mb-8">
                        <img
                            src={logo}
                            alt="MedyCist"
                            className="w-90 h-90 object-contain dark:brightness-110"
                        />
                    </div>

                    <p className="text-sm text-center text-muted mb-6 border-b border-primary-outline/30 pb-4 font-medium">
                        {t(
                            "Introduza o código de acesso fornecido pelo seu médico.",
                            "Enter the access code provided by your doctor."
                        )}
                    </p>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-text">
                                {t("Código de Acesso", "Access Code")}
                            </label>

                            <input
                                value={codigo}
                                onChange={(e) => handleCodigoChange(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleEntrar()
                                }
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                maxLength={CODIGO_LENGTH}
                                placeholder="000000"
                                autoFocus
                                className="
                                    w-full
                                    px-4 py-3
                                    rounded-lg
                                    border-2 border-primary-outline
                                    bg-background
                                    text-text
                                    font-mono
                                    focus:border-primary
                                    focus:outline-none
                                    transition-colors
                                    text-center
                                    text-3xl
                                    tracking-[0.5em]
                                    caret-primary
                                "
                            />

                            <div className="flex justify-center gap-1.5 mt-3">
                                {Array.from({ length: CODIGO_LENGTH }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`h-1.5 w-6 rounded-full transition-colors ${
                                            i < codigo.length ? "bg-primary" : "bg-primary-outline/40"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {erro && (
                            <div className="text-center text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm font-semibold animate-fadeIn">
                                {erro}
                            </div>
                        )}

                        <button
                            onClick={handleEntrar}
                            disabled={aEntrar || codigo.length !== CODIGO_LENGTH}
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
                                disabled:hover:bg-text
                                disabled:active:scale-100
                                disabled:cursor-not-allowed
                                cursor-pointer
                            "
                        >
                            {aEntrar
                                ? t("A validar...", "Validating...")
                                : t("Entrar", "Log In")}
                        </button>
                    </div>
                </div>
            </main>
        </section>
    );
}

export default LoginPage;