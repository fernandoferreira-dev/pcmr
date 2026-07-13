import UserImg from "../../assets/user-notification.png";
import { FaRegTrashAlt } from "react-icons/fa";
import "../../styles/messages-page-styles/message-box-styles.css";
import "../../styles/diagnostic-data-styles/data-containers-styles.css";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/auth-context";

const API_URL = "http://localhost:8080";

type FiltroOpcao = "env" | "rec" | "all";

interface MensagemDTO {
    idMensagem: number;
    idRemetente: number;
    nomeRemetente: string;
    emailRemetente: string;
    idDestinatario: number;
    nomeDestinatario: string;
    emailDestinatario: string;
    assunto: string;
    corpo: string;
    dataEnvio: string;
    lida: boolean;
}

export default function MessageComponent() {
    const { user } = useAuth();
    const userId = user?.userId ?? null;

    const [selectedOption, setSelectedOption] = useState<FiltroOpcao>("env");
    const [pesquisa, setPesquisa] = useState<string>("");
    const [mensagens, setMensagens] = useState<MensagemDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [erro, setErro] = useState<string | null>(null);

    const fetchMensagens = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setErro(null);
        try {
            const params = new URLSearchParams({ userId: String(userId) });
            if (pesquisa) params.append("pesquisa", pesquisa);

            //filtra mensagens enviadas
            if (selectedOption === "env") {
                const res = await fetch(`${API_URL}/api/mensagens/enviadas?${params}`);
                if (!res.ok) {
                    throw new Error("Erro ao carregar mensagens enviadas");
                }
                setMensagens(await res.json() as MensagemDTO[]);

                //filtra mensagens recebidas
            } else if (selectedOption === "rec") {
                const res = await fetch(`${API_URL}/api/mensagens/recebidas?${params}`);
                if (!res.ok) {
                    throw new Error("Erro ao carregar mensagens recebidas");
                }
                setMensagens(await res.json() as MensagemDTO[]);

                //filtra todas de uma maneira muito porca lol
            } else {
                const [resEnv, resRec] = await Promise.all([
                    fetch(`${API_URL}/api/mensagens/enviadas?${params}`),
                    fetch(`${API_URL}/api/mensagens/recebidas?${params}`),
                ]);
                if (!resEnv.ok || !resRec.ok) {
                    throw new Error("Erro ao carregar mensagens");
                }

                const [enviadas, recebidas] = (await Promise.all([
                    resEnv.json(),
                    resRec.json(),
                ])) as [MensagemDTO[], MensagemDTO[]];
                const todas = [...enviadas, ...recebidas].sort(
                    (a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
                );
                setMensagens(todas);
            }
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, [selectedOption, pesquisa, userId]);

    useEffect(() => {
        const timeout = setTimeout(fetchMensagens, 300); // debounce da pesquisa
        return () => clearTimeout(timeout);
    }, [fetchMensagens]);

    const marcarComoLida = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/mensagens/${id}/lida?userId=${userId}`, {
                method: "PATCH",
            });
            if (!res.ok) throw new Error("Erro ao marcar como lida");
            setMensagens((prev) =>
                prev.map((m) => (m.idMensagem === id ? { ...m, lida: true } : m))
            );
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Erro desconhecido");
        }
    };

    const apagarMensagem = async (id: number) => {
        setMensagens((prev) => prev.filter((m) => m.idMensagem !== id));
    };

    return (
        <>
            <div className="data-wrapper">
                <input
                    className="message-search-bar"
                    placeholder="Pesquisar mensagens"
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />
                <label className="option-container">
                    Filtrar por:
                    <select
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value as FiltroOpcao)}
                    >
                        <option value="env">Enviadas</option>
                        <option value="rec">Recebidas</option>
                        <option value="all">Todas</option>
                    </select>
                </label>
            </div>

            <div className="messages-scroll-container">
                {mensagens.map((msg) => {
                    const isRecebida =
                        selectedOption === "all"
                            ? msg.idDestinatario === userId
                            : selectedOption === "rec";
                    const nome = isRecebida ? msg.nomeRemetente : msg.nomeDestinatario;

                    return (
                        <>
                            <div className="notification-wrapper" key={msg.idMensagem}>
                                <div className="message-header">
                                    <div className="sender-info">
                                        <img src={UserImg} alt="Sender" className="message-icon" />
                                        <span className="sender-name">{nome}</span>
                                    </div>
                                    <span className="message-date">{msg.dataEnvio}</span>
                                </div>
                                <div
                                    className="message-body"
                                    onClick={() => isRecebida && !msg.lida && marcarComoLida(msg.idMensagem)}
                                >
                                    <div className="message-top-row">
                                        <span className="message-subject">
                                            <strong>Assunto:</strong> {msg.assunto}
                                        </span>
                                        <div className="message-actions">
                                            <FaRegTrashAlt
                                                className="trash-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    apagarMensagem(msg.idMensagem);
                                                }}
                                            />
                                            {isRecebida && !msg.lida && <div className="unread-dot"></div>}
                                        </div>
                                    </div>
                                    <div className="message-corpo">
                                        <strong>Corpo:</strong> {msg.corpo}
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })}

                {!loading && mensagens.length === 0 && <p>Sem mensagens.</p>}
            </div>
        </>
    );
}