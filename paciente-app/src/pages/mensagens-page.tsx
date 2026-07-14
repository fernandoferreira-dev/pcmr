import { useState, useEffect } from "react";
import "../assets/styles/index.css";

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
    const [erro, setErro] = useState<string | null>(null);
    const [expandida, setExpandida] = useState<number | null>(null);

    useEffect(() => {
        let cancelado = false;

        (async () => {
            try {
                const endpoint = vista === "recebidas" ? "recebidas" : "enviadas";
                const res = await fetch(`/api/mensagens/${endpoint}?userId=${userId}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                if (cancelado) return;

                setMensagens(data);
                setErro(null);
            } catch {
                if (cancelado) return;

                setErro("Não foi possível carregar as mensagens.");
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

    return (
        <div className="min-h-screen bg-background font-sans p-4 pb-20">
            <h1 className="text-text text-xl font-semibold mb-4">Mensagens</h1>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setVista("recebidas")}
                    className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
                        vista === "recebidas" ? "bg-primary text-background" : "border border-primary-outline text-text bg-background"
                    }`}
                >
                    Recebidas
                </button>
                <button
                    onClick={() => setVista("enviadas")}
                    className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
                        vista === "enviadas" ? "bg-primary text-background" : "border border-primary-outline text-text bg-background"
                    }`}
                >
                    Enviadas
                </button>
            </div>

            {erro && <p className="text-red-600 text-sm mb-2">{erro}</p>}
            {!erro && mensagens.length === 0 && <p className="text-muted text-sm">Sem mensagens.</p>}

            <div className="flex flex-col gap-3">
                {mensagens.map((m) => {
                    const nome = vista === "recebidas" ? m.nomeRemetente : m.nomeDestinatario;
                    return (
                        <div key={m.idMensagem} onClick={() => abrir(m)} className="border border-primary-outline rounded-2xl p-4 cursor-pointer bg-background">
                            <div className="flex justify-between items-center">
                                <span className="text-text font-semibold">{nome}</span>
                                <span className="text-xs text-muted">{formatarData(m.dataEnvio)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-muted truncate">{m.assunto}</span>
                                {vista === "recebidas" && !m.lida && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                            </div>
                            {expandida === m.idMensagem && (
                                <p className="mt-2 text-sm text-text whitespace-pre-wrap border-t border-primary-outline pt-2">
                                    {m.corpo || "Sem conteúdo."}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MensagensPage;