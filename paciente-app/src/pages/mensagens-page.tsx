import { useState, useEffect } from "react";
import "../assets/styles/index.css";
import { NovaMensagemModal } from "../components";

type Mensagem = {
    idMensagem: number;
    nomeRemetente: string;
    nomeDestinatario: string;
    assunto: string;
    corpo: string | null;
    dataEnvio: string;
    lida: boolean;
};

type Vista = "recebidas" | "enviadas";

function MensagensPage({ userId }: { userId: number }) {
    const [vista, setVista] = useState<Vista>("recebidas");
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [expandida, setExpandida] = useState<number | null>(null);
    const [mostrarNovaMensagem, setMostrarNovaMensagem] = useState(false);

    useEffect(() => {
        let cancelado = false;
        setCarregando(true);

        (async () => {
            try {
                const endpoint = vista === "recebidas" ? "recebidas" : "enviadas";
                const res = await fetch(`/api/mensagens/${endpoint}?userId=${userId}`);
                if (!res.ok) {
                    if (cancelado) return;
                    setErro("Não foi possível carregar as mensagens.");
                    setCarregando(false);
                    return;
                }
                const data = await res.json();
                if (cancelado) return;
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setMensagens(data);
                setErro(null);
            } catch {
                if (cancelado) return;
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setErro("Não foi possível carregar as mensagens.");
            } finally {
                if (!cancelado) setCarregando(false);
            }
        })();

        return () => {
            cancelado = true;
        };
    }, [vista, userId]);

    const abrir = async (m: Mensagem) => {
        setExpandida((atual) => (atual === m.idMensagem ? null : m.idMensagem));
        if (vista === "recebidas" && !m.lida) {
            try {
                await fetch(`/api/mensagens/${m.idMensagem}/lida?userId=${userId}`, { method: "PATCH" });
                setMensagens((prev) => prev.map((x) => (x.idMensagem === m.idMensagem ? { ...x, lida: true } : x)));
            } catch {
                // falha silenciosa
            }
        }
    };

    const formatarData = (iso: string) =>
        new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

    const naoLidas = mensagens.filter((m) => vista === "recebidas" && !m.lida).length;

    return (
        <div className="min-h-screen bg-background font-sans p-4 pb-24">
            <header className="mb-6 pt-2">
                <h1 className="text-2xl font-bold text-text">Mensagens</h1>
                <p className="text-sm text-muted mt-1">
                    {vista === "recebidas"
                        ? naoLidas > 0
                            ? `Tem ${naoLidas} mensagem${naoLidas > 1 ? "s" : ""} por ler`
                            : "Está tudo lido"
                        : "Mensagens que enviou"}
                </p>
            </header>

            <div className="flex gap-2 mb-5">
                <button
                    onClick={() => setVista("recebidas")}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                        vista === "recebidas"
                            ? "bg-primary text-background shadow-sm"
                            : "border border-primary-outline text-muted bg-background hover:bg-primary/5"
                    }`}
                >
                    Recebidas
                    {naoLidas > 0 && vista !== "recebidas" && (
                        <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[0.6rem]">
                            {naoLidas}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setVista("enviadas")}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                        vista === "enviadas"
                            ? "bg-primary text-background shadow-sm"
                            : "border border-primary-outline text-muted bg-background hover:bg-primary/5"
                    }`}
                >
                    Enviadas
                </button>
            </div>

            {erro && (
                <div className="bg-red-100 text-red-700 rounded-xl p-4 text-sm font-medium text-center mb-4">
                    {erro}
                </div>
            )}

            {carregando && (
                <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-background rounded-2xl border border-primary-outline p-4 shadow-sm animate-pulse">
                            <div className="h-4 w-28 bg-primary/15 rounded mb-2" />
                            <div className="h-3 w-full bg-primary/10 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {!carregando && !erro && mensagens.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.8 11.6 19.79 19.79 0 0 1 1.72 3 2 2 0 0 1 3.7 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.7a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 15.92z" />
                        </svg>
                    </div>
                    <p className="text-muted text-sm">
                        {vista === "recebidas" ? "Sem mensagens recebidas." : "Ainda não enviou nenhuma mensagem."}
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {mensagens.map((m) => {
                    const nome = vista === "recebidas" ? m.nomeRemetente : m.nomeDestinatario;
                    const naoLida = vista === "recebidas" && !m.lida;
                    return (
                        <article
                            key={m.idMensagem}
                            onClick={() => abrir(m)}
                            className={`rounded-2xl p-4 cursor-pointer bg-background shadow-sm hover:shadow-md transition-shadow border ${
                                naoLida ? "border-primary" : "border-primary-outline"
                            }`}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {naoLida && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                                    <span className={`truncate ${naoLida ? "font-bold text-text" : "font-semibold text-text"}`}>
                                        {nome}
                                    </span>
                                </div>
                                <span className="text-xs text-muted shrink-0">{formatarData(m.dataEnvio)}</span>
                            </div>

                            <p className={`text-sm mt-1.5 truncate ${naoLida ? "text-text font-medium" : "text-muted"}`}>
                                {m.assunto}
                            </p>

                            {expandida === m.idMensagem && (
                                <p className="mt-3 text-sm text-text whitespace-pre-wrap border-t border-primary-outline pt-3">
                                    {m.corpo || "Sem conteúdo."}
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>

            <button
                onClick={() => setMostrarNovaMensagem(true)}
                className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                title="Nova mensagem"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                </svg>
            </button>

            {mostrarNovaMensagem && (
                <NovaMensagemModal
                    idRemetente={userId}
                    onClose={() => setMostrarNovaMensagem(false)}
                    onEnviada={() => {
                        setMostrarNovaMensagem(false);
                        setVista("enviadas");
                    }}
                />
            )}
        </div>
    );
}

export default MensagensPage;