import { useState, useEffect, useRef, useCallback } from "react";
import "../assets/styles/index.css";

interface UtilizadorResumo {
    idUtilizador: number;
    nome: string;
    email: string;
    tipoUtilizador: string;
}

type Props = {
    idRemetente: number;
    onClose: () => void;
    onEnviada: () => void;
};

function NovaMensagemModal({ idRemetente, onClose, onEnviada }: Props) {
    const [termo, setTermo] = useState("");
    const [resultados, setResultados] = useState<UtilizadorResumo[]>([]);
    const [destinatario, setDestinatario] = useState<UtilizadorResumo | null>(null);
    const [assunto, setAssunto] = useState("");
    const [corpo, setCorpo] = useState("");
    const [aEnviar, setAEnviar] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const procurar = useCallback(async (nome: string) => {
        if (!nome.trim()) {
            setResultados([]);
            return;
        }
        try {
            const res = await fetch(
                `/api/mensagens/utilizadores/procurar?nome=${encodeURIComponent(nome)}&excluirId=${idRemetente}`
            );
            if (!res.ok) return;
            const data: UtilizadorResumo[] = await res.json();
            setResultados(data);
        } catch {
            // falha silenciosa
        }
    }, [idRemetente]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => procurar(termo), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [termo, procurar]);

    const podeEnviar = destinatario !== null && assunto.trim() !== "";

    const enviar = async () => {
        setAEnviar(true);
        setErro(null);

        try {
            const res = await fetch("/api/mensagens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idRemetente,
                    idDestinatario: destinatario?.idUtilizador,
                    assunto,
                    corpo,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setErro(data.erro || "Erro ao enviar a mensagem.");
                return;
            }

            onEnviada();
        } catch {
            setErro("Erro de comunicação com o servidor.");
        } finally {
            setAEnviar(false);
        }
    };

    return (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-3xl shadow-xl w-full max-w-lg p-6 relative font-sans">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-text text-xl cursor-pointer"
                    title="Fechar"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold text-text mb-4">Nova Mensagem</h2>

                {!destinatario ? (
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="Procurar destinatário por nome..."
                            value={termo}
                            onChange={(e) => setTermo(e.target.value)}
                            className="border border-primary-outline rounded-xl px-3 py-2 text-sm cursor-text bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        />

                        <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                            {resultados.map((u) => (
                                <button
                                    key={u.idUtilizador}
                                    onClick={() => setDestinatario(u)}
                                    className="text-left px-3 py-2 rounded-xl text-sm bg-primary/10 hover:bg-primary/20 text-text transition-colors cursor-pointer"
                                >
                                    <div className="font-medium">
                                        {u.nome} <span className="text-xs text-muted">({u.tipoUtilizador})</span>
                                    </div>
                                    <div className="text-xs text-muted">{u.email}</div>
                                </button>
                            ))}
                            {resultados.length === 0 && termo.trim() !== "" && (
                                <p className="text-xs text-muted px-1">Nenhum utilizador encontrado.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2">
                            <div>
                                <div className="text-sm font-medium text-text">{destinatario.nome}</div>
                                <div className="text-xs text-muted">{destinatario.email}</div>
                            </div>
                            <button
                                onClick={() => setDestinatario(null)}
                                className="text-xs text-muted hover:text-text underline cursor-pointer"
                            >
                                Trocar
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Assunto"
                            value={assunto}
                            onChange={(e) => setAssunto(e.target.value)}
                            className="border border-primary-outline rounded-xl px-3 py-2 text-sm cursor-text bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        />

                        <textarea
                            placeholder="Mensagem"
                            value={corpo}
                            onChange={(e) => setCorpo(e.target.value)}
                            rows={5}
                            className="border border-primary-outline rounded-xl px-3 py-2 text-sm resize-none cursor-text bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

                {erro && <p className="text-sm text-red-600 mt-3">{erro}</p>}

                <button
                    disabled={!podeEnviar || aEnviar}
                    onClick={enviar}
                    className="w-full mt-4 py-2 bg-primary hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed rounded-full text-background font-medium transition-colors shadow-sm"
                >
                    {aEnviar ? "A enviar..." : "Enviar"}
                </button>
            </div>
        </div>
    );
}

export default NovaMensagemModal;