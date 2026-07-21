import { useState, useEffect } from "react";
import "../assets/styles/index.css";

type Diagnostico = {
    id: number;
    date: string;
    status: string;
    temperatura: number;
    bpm: number;
    magnitudeG: number;
};

type ModalProps = {
    diagnostico: Diagnostico;
    onClose: () => void;
};

function DiagnosticoDetalheModal({ diagnostico, onClose }: ModalProps) {
    const formatarData = (iso: string) =>
        new Date(iso).toLocaleString("pt-PT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-3xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative font-sans border-t-8 border-primary">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-text text-xl cursor-pointer"
                    title="Fechar"
                >
                    ✕
                </button>

                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Diagnóstico #{diagnostico.id}
        </span>
                <h2 className="text-xl font-bold text-text mt-1 mb-1">
                    {formatarData(diagnostico.date)}
                </h2>

                <div className="grid grid-cols-3 gap-3 my-5">
                    <div className="flex flex-col items-center bg-primary/5 rounded-2xl py-4">
                        <span className="text-2xl">🌡️</span>
                        <span className="text-lg font-bold text-text mt-1">
              {diagnostico.temperatura?.toFixed?.(1) ?? diagnostico.temperatura} °C
            </span>
                        <span className="text-[0.65rem] text-muted uppercase tracking-wide mt-0.5">
              Temperatura
            </span>
                    </div>
                    <div className="flex flex-col items-center bg-primary/5 rounded-2xl py-4">
                        <span className="text-2xl">❤️</span>
                        <span className="text-lg font-bold text-text mt-1">{diagnostico.bpm} bpm</span>
                        <span className="text-[0.65rem] text-muted uppercase tracking-wide mt-0.5">
              Cardíaco
            </span>
                    </div>
                    <div className="flex flex-col items-center bg-primary/5 rounded-2xl py-4">
                        <span className="text-2xl">📈</span>
                        <span className="text-lg font-bold text-text mt-1">
              {diagnostico.magnitudeG?.toFixed?.(2) ?? diagnostico.magnitudeG} G
            </span>
                        <span className="text-[0.65rem] text-muted uppercase tracking-wide mt-0.5">
              Magnitude
            </span>
                    </div>
                </div>

                <div className="border-t border-primary-outline pt-4">
                    <h3 className="text-sm font-semibold text-text mb-2">Observações do médico</h3>
                    <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                        {diagnostico.status?.trim() ? diagnostico.status : "Sem observações registadas."}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-primary text-background font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
}

export default function DiagnosticosPage({ idPessoa }: { idPessoa: number }) {
    const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [selecionado, setSelecionado] = useState<Diagnostico | null>(null);

    useEffect(() => {
        let cancelado = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCarregando(true);

        (async () => {
            try {
                const res = await fetch(`/api/diagnosticos?idPaciente=${idPessoa}`);
                if (!res.ok) {
                    if (!cancelado) setErro("Não foi possível carregar os diagnósticos.");
                    return;
                }
                const data: Diagnostico[] = await res.json();
                if (!cancelado) {
                    setDiagnosticos(data);
                    setErro(null);
                }
            } catch {
                if (!cancelado) setErro("Erro de comunicação com o servidor.");
            } finally {
                if (!cancelado) setCarregando(false);
            }
        })();

        return () => {
            cancelado = true;
        };
    }, [idPessoa]);

    const formatarData = (iso: string) =>
        new Date(iso).toLocaleString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="min-h-screen bg-background font-sans p-4 pb-24">
            <header className="mb-6 pt-2">
                <h1 className="text-2xl font-bold text-text">Diagnósticos</h1>
                <p className="text-sm text-muted mt-1">Histórico das suas consultas</p>
            </header>

            {erro && (
                <div className="bg-red-100 text-red-700 rounded-xl p-4 text-sm font-medium text-center mb-4">
                    {erro}
                </div>
            )}

            {carregando && (
                <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-primary-outline p-4 shadow-sm animate-pulse"
                        >
                            <div className="h-4 w-28 bg-primary/15 rounded mb-2" />
                            <div className="h-3 w-full bg-primary/10 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {!carregando && !erro && diagnosticos.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
                    <p className="text-muted text-sm">Ainda não existem diagnósticos registados.</p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {diagnosticos.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelecionado(d)}
                        className="text-left rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow border border-primary-outline cursor-pointer"
                    >
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                                Diagnóstico #{d.id}
                            </span>
                            <span className="text-xs text-muted shrink-0">{formatarData(d.date)}</span>
                        </div>
                        <p className="text-sm text-text mt-1.5 truncate">
                            {d.status?.trim() ? d.status : "Sem observações"}
                        </p>
                    </button>
                ))}
            </div>

            {selecionado && (
                <DiagnosticoDetalheModal
                    diagnostico={selecionado}
                    onClose={() => setSelecionado(null)}
                />
            )}
        </div>
    );
}