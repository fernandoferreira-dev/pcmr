import UserImg from "../../assets/user-notification.png";
import { BsPinAngle, BsPinAngleFill } from "react-icons/bs";
import { FaRegTrashAlt } from "react-icons/fa";
import "../../styles/messages-page-styles/message-box-styles.css";
import "../../styles/diagnostic-data-styles/data-containers-styles.css";
import '../../styles/status-page-styles/status-ping-styles.css'
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/auth-context";
import { useTranslation } from "react-i18next";


type FiltroOpcao = "env" | "rec" | "all" | "saved";

interface MensagemDTO {
    idMensagem: number
    idRemetente: number
    nomeRemetente: string
    emailRemetente: string
    idDestinatario: number
    nomeDestinatario: string
    emailDestinatario: string
    assunto: string
    corpo: string | null
    dataEnvio: string
    lida: boolean
    guardada: boolean

}

export default function MessageComponent() {
    const { user } = useAuth();
    const userId = user?.userId ?? null;
    const {t} = useTranslation();
    const [selectedOption, setSelectedOption] = useState<FiltroOpcao>("env");
    const [pesquisa, setPesquisa] = useState<string>("");
    const [mensagens, setMensagens] = useState<MensagemDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [erro, setErro] = useState<string | null>(null);
    const [aGuardarId, setAGuardarId] = useState<number | null>(null)

    const fetchMensagens = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setErro(null);
        try {
            const params = new URLSearchParams({ userId: String(userId) });
            if (pesquisa) params.append("pesquisa", pesquisa);

            //filtra mensagens enviadas
            if (selectedOption === "env") {
                //const res = await fetch(`${API_URL}/api/mensagens/enviadas?${params}`);
                const res = await fetch(`/api/mensagens/enviadas?${params}`);
                if (!res.ok) {
                    throw new Error("Erro ao carregar mensagens enviadas");
                }
                setMensagens(await res.json() as MensagemDTO[]);

                //filtra mensagens recebidas
            } else if (selectedOption === "rec") {
                //const res = await fetch(`${API_URL}/api/mensagens/recebidas?${params}`);
                const res = await fetch(`/api/mensagens/recebidas?${params}`);
                if (!res.ok) {
                    throw new Error("Erro ao carregar mensagens recebidas");
                }
                setMensagens(await res.json() as MensagemDTO[]);

            }
            //filtra todas de uma maneira muito porca lol
            else if (selectedOption === "all") {
                const [resEnv, resRec] = await Promise.all([
                    //fetch(`${API_URL}/api/mensagens/enviadas?${params}`),
                    //fetch(`${API_URL}/api/mensagens/recebidas?${params}`),
                    fetch(`/api/mensagens/enviadas?${params}`),
                    fetch(`/api/mensagens/recebidas?${params}`),
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
            //filtra mensagens guardadas (enviadas + recebidas, apenas as marcadas como guardada)
            else if (selectedOption === "saved") {
                const [resEnv, resRec] = await Promise.all([
                    //fetch(`${API_URL}/api/mensagens/enviadas?${params}`),
                    //fetch(`${API_URL}/api/mensagens/recebidas?${params}`),
                    fetch(`/api/mensagens/enviadas?${params}`),
                    fetch(`/api/mensagens/recebidas?${params}`),
                ]);
                if (!resEnv.ok || !resRec.ok) {
                    throw new Error("Erro ao carregar mensagens guardadas");
                }

                const [enviadas, recebidas] = (await Promise.all([
                    resEnv.json(),
                    resRec.json(),
                ])) as [MensagemDTO[], MensagemDTO[]];
                const guardadas = [...enviadas, ...recebidas]
                    .filter((m) => m.guardada)
                    .sort(
                        (a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
                    );
                setMensagens(guardadas);
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
            //const res = await fetch(`${API_URL}/api/mensagens/${id}/lida?userId=${userId}`, {
            const res = await fetch(`/api/mensagens/${id}/lida?userId=${userId}`, {
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

    const alternarGuardada = async (idMensagem: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setAGuardarId(idMensagem)

        try {
            const res = await fetch(`/api/mensagens/${idMensagem}/guardar?userId=${userId}`, {
                method: 'PATCH',
            })
            if (res.ok) {
                const atualizada: MensagemDTO = await res.json()
                setMensagens((prev) => {
                    //tira a mensagem da lista quando deixa de tar guardada
                    if (selectedOption === "saved" && !atualizada.guardada) {
                        return prev.filter((m) => m.idMensagem !== idMensagem);
                    }
                    return prev.map((m) =>
                        m.idMensagem === idMensagem ? { ...m, guardada: atualizada.guardada } : m
                    );
                })
            }
        } catch {
            // falha silenciosa
        } finally {
            setAGuardarId(null)
        }
    }

    const formatDate = (dataEnvio: string) => {
        return new Date(dataEnvio).toLocaleString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return (
        <>
            <div className="data-wrapper">
                <input
                    className="message-search-bar"
                    placeholder="Pesquisar mensagens"
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />
                {t('communication.filterBy')}
                <label className="option-container">
                    <select
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value as FiltroOpcao)}
                    >
                        <option value="env">{t('communication.sent')}</option>
                        <option value="rec">{t('communication.received')}</option>
                        <option value="all">{t('communication.all')}</option>
                        <option value="saved">{t('communication.saved')}</option>
                    </select>
                </label>
            </div>
            <div className="messages-scroll-container">
                {mensagens.map((msg) => {
                    const isRecebida =
                        selectedOption === "env"
                            ? false
                            : selectedOption === "rec"
                                ? true
                                : msg.idDestinatario === userId;
                    const nome = isRecebida ? msg.nomeRemetente : msg.nomeDestinatario;

                    return (
                        <>
                            <div className="notification-wrapper" key={msg.idMensagem}>
                                <div className="message-header">
                                    <div className="sender-info">
                                        <img src={UserImg} alt="Sender" className="message-icon" />
                                        <span className="sender-name">{nome}</span>
                                    </div>
                                    <span className="message-date">{formatDate(msg.dataEnvio)}</span>
                                </div>
                                <div
                                    className="message-body"
                                    onClick={() => isRecebida && !msg.lida && marcarComoLida(msg.idMensagem)}
                                >
                                    <div className="message-top-row">
                                        <span className="message-subject">
                                            <strong>{t('communication.subject')}</strong> {msg.assunto}
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
                                            {msg.guardada ? (
                                                <BsPinAngleFill
                                                    className="trash-icon"
                                                    onClick={(e) => alternarGuardada(msg.idMensagem, e)}
                                                />
                                            ) :
                                                (
                                                    <BsPinAngle
                                                        className="trash-icon"
                                                        onClick={(e) => alternarGuardada(msg.idMensagem, e)}
                                                    />
                                                )}
                                        </div>
                                    </div>
                                    <div className="message-corpo">
                                        <strong>{t('communication.body')}</strong> {msg.corpo}
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