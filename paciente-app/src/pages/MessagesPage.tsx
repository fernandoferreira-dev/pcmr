import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "../assets/styles/index.css";
import { NewMessageModal } from "../components/NewMessageModal";

type Message = {
    idMensagem: number;
    nomeRemetente: string;
    nomeDestinatario: string;
    assunto: string;
    corpo: string | null;
    dataEnvio: string;
    lida: boolean;
};

type ViewMode = "inbox" | "sent";

function MessagesPage({ userId }: { userId: number }) {
    const { idioma, t } = useApp();
    const [viewMode, setViewMode] = useState<ViewMode>("inbox");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchMessages() {
            setIsLoading(true);
            setError(null);

            try {
                const endpoint = viewMode === "inbox" ? "recebidas" : "enviadas";
                const res = await fetch(`/api/mensagens/${endpoint}?userId=${userId}`, {
                    signal: controller.signal,
                });

                if (!res.ok) throw new Error();

                const data = await res.json();
                setMessages(data);
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== "AbortError") {
                    setError(t("Não foi possível carregar as mensagens.", "Unable to load messages."));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        fetchMessages();
        return () => controller.abort();
    }, [viewMode, userId, t]);

    const handleOpenMessage = async (m: Message) => {
        const newExpandedState = expandedId === m.idMensagem ? null : m.idMensagem;
        setExpandedId(newExpandedState);

        if (viewMode === "inbox" && !m.lida) {
            try {
                await fetch(`/api/mensagens/${m.idMensagem}/lida?userId=${userId}`, { method: "PATCH" });
                setMessages((prev) =>
                    prev.map((x) => (x.idMensagem === m.idMensagem ? { ...x, lida: true } : x))
                );
            } catch {
                // Falha silenciosa
            }
        }
    };

    const formatDate = (iso: string) => {
        const date = new Date(iso);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const locale = idioma === "pt" ? "pt-PT" : "en-US";

        if (isToday) {
            return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        }
        return date.toLocaleDateString(locale, { day: "2-digit", month: "short" });
    };

    const getInitials = (name: string) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const unreadCount = messages.filter((m) => viewMode === "inbox" && !m.lida).length;

    return (
        <div className="min-h-screen bg-background font-sans px-4 pt-4 pb-28 sm:max-w-md sm:mx-auto select-none touch-manipulation">
            {/* Cabeçalho */}
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-text">
                        {t("Mensagens", "Messages")}
                    </h1>
                    <p className="text-xs text-muted mt-0.5 font-medium">
                        {viewMode === "inbox"
                            ? unreadCount > 0
                                ? t(`Tem ${unreadCount} por ler`, `You have ${unreadCount} unread`)
                                : t("Caixa de entrada limpa", "Inbox is clear")
                            : t("Mensagens enviadas", "Sent messages")}
                    </p>
                </div>
            </header>

            {/* Selector de Abas Mobile */}
            <div className="flex bg-primary/10 p-1 rounded-2xl mb-4 border border-primary-outline/30">
                <button
                    onClick={() => setViewMode("inbox")}
                    className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                        viewMode === "inbox"
                            ? "bg-background text-text shadow-xs"
                            : "text-muted hover:text-text"
                    }`}
                >
                    <span>{t("Recebidas", "Inbox")}</span>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-red-500 text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setViewMode("sent")}
                    className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                        viewMode === "sent"
                            ? "bg-background text-text shadow-xs"
                            : "text-muted hover:text-text"
                    }`}
                >
                    {t("Enviadas", "Sent")}
                </button>
            </div>

            {/* Erro */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl p-3.5 text-xs font-semibold text-center mb-4">
                    {error}
                </div>
            )}

            {/* Skeleton Loading */}
            {isLoading && (
                <div className="flex flex-col gap-2.5">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="bg-background rounded-2xl border border-primary-outline/40 p-3.5 animate-pulse flex gap-3 items-center">
                            <div className="w-11 h-11 rounded-full bg-primary/10 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="h-4 w-28 bg-primary/15 rounded mb-2" />
                                <div className="h-3 w-40 bg-primary/10 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Estado Vazio */}
            {!isLoading && !error && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-background rounded-3xl border border-dashed border-primary-outline/60 my-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-text">
                        {t("Sem mensagens", "No messages")}
                    </p>
                    <p className="text-xs text-muted mt-1">
                        {viewMode === "inbox"
                            ? t("Não tem mensagens por ler.", "You have no unread messages.")
                            : t("Ainda não enviou mensagens.", "You haven't sent any messages yet.")}
                    </p>
                </div>
            )}

            {/* Lista de Mensagens */}
            <div className="flex flex-col gap-2.5">
                {messages.map((m) => {
                    const name = viewMode === "inbox" ? m.nomeRemetente : m.nomeDestinatario;
                    const isUnread = viewMode === "inbox" && !m.lida;
                    const isExpanded = expandedId === m.idMensagem;

                    return (
                        <article
                            key={m.idMensagem}
                            onClick={() => handleOpenMessage(m)}
                            className={`rounded-2xl p-3.5 transition-all active:scale-[0.99] border cursor-pointer ${
                                isUnread
                                    ? "bg-primary/5 border-primary/40 shadow-2xs"
                                    : "bg-background border-primary-outline/40"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                    isUnread ? "bg-primary text-background" : "bg-primary/10 text-primary"
                                }`}>
                                    {getInitials(name)}
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                                            <span className={`truncate text-sm ${isUnread ? "font-black text-text" : "font-bold text-text"}`}>
                                                {name}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-medium text-muted shrink-0">
                                            {formatDate(m.dataEnvio)}
                                        </span>
                                    </div>

                                    <p className={`text-xs mt-1 truncate ${isUnread ? "text-text font-semibold" : "text-muted"}`}>
                                        {m.assunto}
                                    </p>

                                    {isExpanded && (
                                        <div className="mt-3 text-xs text-text whitespace-pre-wrap border-t border-primary-outline/30 pt-3 leading-relaxed animate-fadeIn select-text">
                                            {m.corpo || <span className="italic text-muted">{t("Sem conteúdo adicional.", "No additional content.")}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* FAB (Floating Action Button) */}
            <button
                onClick={() => setIsNewMessageOpen(true)}
                className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 h-14 px-5 rounded-full bg-primary text-background font-bold shadow-xl active:scale-95 transition-all flex items-center gap-2 z-30 cursor-pointer"
                aria-label={t("Nova mensagem", "New message")}
            >
                <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-sm">{t("Nova", "New")}</span>
            </button>

            {isNewMessageOpen && (
                <NewMessageModal
                    senderId={userId}
                    onClose={() => setIsNewMessageOpen(false)}
                    onSent={() => {
                        setIsNewMessageOpen(false);
                        setViewMode("sent");
                    }}
                />
            )}
        </div>
    );
}

export default MessagesPage;