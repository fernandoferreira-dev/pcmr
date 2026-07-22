import { useState, useEffect, useRef, useCallback } from "react";
import "../assets/styles/index.css";

export interface UtilizadorResumo {
    idUtilizador: number;
    nome: string;
    email: string;
    tipoUtilizador: string;
}

export type Props = {
    idRemetente: number;
    onClose: () => void;
    onEnviada: () => void;
};

export function NovaMensagemModal({ idRemetente, onClose, onEnviada }: Props) {
    const [termo, setTermo] = useState("");
    const [resultados, setResultados] = useState<UtilizadorResumo[]>([]);
    const [destinatario, setDestinatario] = useState<UtilizadorResumo | null>(null);
    const [assunto, setAssunto] = useState("");
    const [corpo, setCorpo] = useState("");
    const [aProcurar, setAProcurar] = useState(false);
    const [aEnviar, setAEnviar] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const procurar = useCallback(
        async (nome: string) => {
            if (!nome.trim()) {
                setResultados([]);
                setAProcurar(false);
                return;
            }

            setAProcurar(true);
            try {
                const res = await fetch(
                    `/api/mensagens/utilizadores/procurar?nome=${encodeURIComponent(nome)}&excluirId=${idRemetente}`
                );
                if (!res.ok) return;
                const data: UtilizadorResumo[] = await res.json();
                setResultados(data);
            } catch {
                // Falha silenciosa
            } finally {
                setAProcurar(false);
            }
        },
        [idRemetente]
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => procurar(termo), 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [termo, procurar]);

    const podeEnviar = destinatario !== null && assunto.trim() !== "";

    const enviar = async () => {
        if (!podeEnviar || aEnviar || !destinatario) return;

        setAEnviar(true);
        setErro(null);

        try {
            const res = await fetch("/api/mensagens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idRemetente,
                    idDestinatario: destinatario.idUtilizador,
                    assunto: assunto.trim(),
                    corpo: corpo.trim() || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setErro(data.erro || "Erro ao enviar a mensagem.");
                return;
            }

            onEnviada();
        } catch {
            setErro("Erro de comunicação.");
        } finally {
            setAEnviar(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop escuro separado */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal Bottom Sheet em Mobile */}
            <div className="relative z-10 bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 max-h-[90vh] flex flex-col font-sans border-t sm:border border-primary-outline/40 animate-slideUp sm:animate-fadeIn pb-[calc(1.25rem+env(safe-area-inset-bottom))]">

                {/* Pega Tátil para Mobile */}
                <div className="w-12 h-1.5 bg-primary/20 rounded-full mx-auto mb-3 sm:hidden" />

                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-text">Nova Mensagem</h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-muted active:bg-primary/20 transition-colors cursor-pointer"
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>

                {/* Corpo do Modal */}
                <div className="overflow-y-auto flex-1 pr-0.5 space-y-3 touch-pan-y">
                    {!destinatario ? (
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Procurar destinatário..."
                                    value={termo}
                                    onChange={(e) => setTermo(e.target.value)}
                                    className="w-full border border-primary-outline rounded-xl px-4 py-3 text-base sm:text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {aProcurar && (
                                    <div className="absolute right-3.5 top-3.5 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>

                            <div className="max-h-56 overflow-y-auto flex flex-col gap-2">
                                {resultados.map((u) => (
                                    <button
                                        key={u.idUtilizador}
                                        onClick={() => setDestinatario(u)}
                                        className="text-left p-3.5 rounded-xl bg-primary/5 active:bg-primary/20 text-text transition-colors flex items-center justify-between cursor-pointer"
                                    >
                                        <div>
                                            <div className="font-bold text-sm">
                                                {u.nome}
                                                <span className="ml-1.5 text-xs font-normal text-muted capitalize">
                                                    ({u.tipoUtilizador})
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted mt-0.5">{u.email}</div>
                                        </div>
                                    </button>
                                ))}
                                {resultados.length === 0 && termo.trim() !== "" && !aProcurar && (
                                    <p className="text-xs text-muted text-center py-4">Nenhum utilizador encontrado.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3">
                                <div className="min-w-0 pr-2">
                                    <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Para</span>
                                    <div className="text-sm font-bold text-text truncate">{destinatario.nome}</div>
                                    <div className="text-xs text-muted truncate">{destinatario.email}</div>
                                </div>
                                <button
                                    onClick={() => setDestinatario(null)}
                                    className="text-xs text-primary font-bold underline px-2 py-1 shrink-0 cursor-pointer"
                                >
                                    Alterar
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Assunto"
                                value={assunto}
                                onChange={(e) => setAssunto(e.target.value)}
                                className="w-full border border-primary-outline rounded-xl px-4 py-3 text-base sm:text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />

                            <textarea
                                placeholder="Escreva a mensagem..."
                                value={corpo}
                                onChange={(e) => setCorpo(e.target.value)}
                                rows={4}
                                className="w-full border border-primary-outline rounded-xl px-4 py-3 text-base sm:text-sm resize-none bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    )}

                    {erro && (
                        <p className="text-xs font-semibold text-red-500 text-center bg-red-500/10 py-2.5 rounded-xl">
                            {erro}
                        </p>
                    )}
                </div>

                {/* Botão de Envio */}
                <button
                    disabled={!podeEnviar || aEnviar}
                    onClick={enviar}
                    className="w-full mt-4 py-3.5 bg-primary text-background font-bold rounded-xl active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 text-base shrink-0 cursor-pointer"
                >
                    {aEnviar ? (
                        <>
                            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            <span>A enviar...</span>
                        </>
                    ) : (
                        <span>Enviar Mensagem</span>
                    )}
                </button>
            </div>
        </div>
    );
}

export default NovaMensagemModal;