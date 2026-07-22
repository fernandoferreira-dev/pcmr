import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import "../assets/styles/index.css";

export interface UserSummary {
    userId: number;
    name: string;
    email: string;
    userType: string;
}

export type Props = {
    senderId: number;
    onClose: () => void;
    onSent: () => void;
};

export function NewMessageModal({ senderId, onClose, onSent }: Props) {
    const { t } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<UserSummary[]>([]);
    const [recipient, setRecipient] = useState<UserSummary | null>(null);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback(
        async (name: string) => {
            if (!name.trim()) {
                setResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(
                    `/api/mensagens/utilizadores/procurar?nome=${encodeURIComponent(name)}&excluirId=${senderId}`
                );
                if (!res.ok) return;
                const data = await res.json();

                // Tipagem segura em vez de 'any'
                const mappedResults: UserSummary[] = (data as Array<{
                    idUtilizador: number;
                    nome: string;
                    email: string;
                    tipoUtilizador: string;
                }>).map((u) => ({
                    userId: u.idUtilizador,
                    name: u.nome,
                    email: u.email,
                    userType: u.tipoUtilizador
                }));

                setResults(mappedResults);
            } catch {
                // Falha silenciosa
            } finally {
                setIsSearching(false);
            }
        },
        [senderId]
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(searchTerm), 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm, handleSearch]);

    const canSend = recipient !== null && subject.trim() !== "";

    const handleSend = async () => {
        if (!canSend || isSending || !recipient) return;

        setIsSending(true);
        setError(null);

        try {
            const res = await fetch("/api/mensagens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idRemetente: senderId,
                    idDestinatario: recipient.userId,
                    assunto: subject.trim(),
                    corpo: body.trim() || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.erro || t("Erro ao enviar a mensagem.", "Error sending the message."));
                return;
            }

            onSent();
        } catch {
            setError(t("Erro de comunicação.", "Communication error."));
        } finally {
            setIsSending(false);
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
                    <h2 className="text-lg font-bold text-text">
                        {t("Nova Mensagem", "New Message")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-muted hover:text-text hover:bg-primary/20 transition-all cursor-pointer"
                        aria-label={t("Fechar", "Close")}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Corpo do Modal */}
                <div className="overflow-y-auto flex-1 pr-0.5 space-y-3 touch-pan-y">
                    {!recipient ? (
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t("Procurar destinatário...", "Search recipient...")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full border border-primary-outline rounded-xl px-4 py-3 text-base sm:text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {isSearching && (
                                    <div className="absolute right-3.5 top-3.5 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>

                            <div className="max-h-56 overflow-y-auto flex flex-col gap-2">
                                {results.map((u) => (
                                    <button
                                        key={u.userId}
                                        onClick={() => setRecipient(u)}
                                        className="text-left p-3.5 rounded-xl bg-primary/5 active:bg-primary/20 text-text transition-colors flex items-center justify-between cursor-pointer"
                                    >
                                        <div>
                                            <div className="font-bold text-sm">
                                                {u.name}
                                                <span className="ml-1.5 text-xs font-normal text-muted capitalize">
                                                    ({u.userType})
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted mt-0.5">{u.email}</div>
                                        </div>
                                    </button>
                                ))}
                                {results.length === 0 && searchTerm.trim() !== "" && !isSearching && (
                                    <p className="text-xs text-muted text-center py-4">
                                        {t("Nenhum utilizador encontrado.", "No users found.")}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3">
                                <div className="min-w-0 pr-2">
                                    <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">
                                        {t("Para", "To")}
                                    </span>
                                    <div className="text-sm font-bold text-text truncate">{recipient.name}</div>
                                    <div className="text-xs text-muted truncate">{recipient.email}</div>
                                </div>
                                <button
                                    onClick={() => setRecipient(null)}
                                    className="text-xs text-primary font-bold underline px-2 py-1 shrink-0 cursor-pointer"
                                >
                                    {t("Alterar", "Change")}
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder={t("Assunto", "Subject")}
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full border border-primary-outline rounded-xl px-4 py-3 text-base sm:text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />

                            <textarea
                                placeholder={t("Escreva a mensagem...", "Write your message...")}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={4}
                                className="w-full border border-primary-outline rounded-xl px-4 py-3 text-base sm:text-sm resize-none bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-xs font-semibold text-red-500 text-center bg-red-500/10 py-2.5 rounded-xl">
                            {error}
                        </p>
                    )}
                </div>

                {/* Botão de Envio */}
                <button
                    disabled={!canSend || isSending}
                    onClick={handleSend}
                    className="w-full mt-4 py-3.5 bg-primary text-background font-bold rounded-xl active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 text-base shrink-0 cursor-pointer"
                >
                    {isSending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            <span>{t("A enviar...", "Sending...")}</span>
                        </>
                    ) : (
                        <span>{t("Enviar Mensagem", "Send Message")}</span>
                    )}
                </button>
            </div>
        </div>
    );
}

export default NewMessageModal;