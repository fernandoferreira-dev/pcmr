import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
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
    const { idioma, t } = useApp();

    const formatarData = (iso: string) =>
        new Date(iso).toLocaleString(idioma === "pt" ? "pt-PT" : "en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal Bottom Sheet */}
            <div className="relative z-10 bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 max-h-[88vh] flex flex-col font-sans border-t sm:border border-primary-outline/40 animate-slideUp sm:animate-fadeIn pb-[calc(1.25rem+env(safe-area-inset-bottom))]">

                {/* Pega Tátil */}
                <div className="w-12 h-1.5 bg-primary/20 rounded-full mx-auto mb-3 sm:hidden" />

                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                            {t("Diagnóstico", "Diagnosis")} #{diagnostico.id}
                        </span>
                        <h2 className="text-base font-bold text-text mt-0.5">
                            {formatarData(diagnostico.date)}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-muted active:bg-primary/20 transition-colors cursor-pointer shrink-0"
                        aria-label={t("Fechar", "Close")}
                    >
                        ✕
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="overflow-y-auto flex-1 pr-0.5 space-y-4 touch-pan-y">
                    {/* Grelha de Métricas */}
                    <div className="grid grid-cols-3 gap-2 my-2">
                        <div className="flex flex-col items-center bg-primary/5 border border-primary/10 rounded-2xl p-3">
                            <span className="text-xl">🌡️</span>
                            <span className="text-sm font-black text-text mt-1">
                                {diagnostico.temperatura?.toFixed?.(1) ?? diagnostico.temperatura} <span className="text-[10px] font-normal">°C</span>
                            </span>
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5">
                                {t("Temp.", "Temp.")}
                            </span>
                        </div>

                        <div className="flex flex-col items-center bg-primary/5 border border-primary/10 rounded-2xl p-3">
                            <span className="text-xl">❤️</span>
                            <span className="text-sm font-black text-text mt-1">
                                {diagnostico.bpm} <span className="text-[10px] font-normal">bpm</span>
                            </span>
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5">
                                {t("Cardíaco", "Heart Rate")}
                            </span>
                        </div>

                        <div className="flex flex-col items-center bg-primary/5 border border-primary/10 rounded-2xl p-3">
                            <span className="text-xl">📈</span>
                            <span className="text-sm font-black text-text mt-1">
                                {diagnostico.magnitudeG?.toFixed?.(2) ?? diagnostico.magnitudeG} <span className="text-[10px] font-normal">G</span>
                            </span>
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5">
                                {t("Magnitude", "Magnitude")}
                            </span>
                        </div>
                    </div>

                    {/* Observações Médicas */}
                    <div className="bg-primary/5 border border-primary-outline/30 rounded-2xl p-3.5">
                        <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t("Observações Médicas", "Doctor's Notes")}
                        </h3>
                        <p className="text-xs text-text leading-relaxed whitespace-pre-wrap select-text">
                            {diagnostico.status?.trim()
                                ? diagnostico.status
                                : t("Sem observações registadas para este diagnóstico.", "No notes registered for this diagnosis.")}
                        </p>
                    </div>
                </div>

                {/* Botão para Fechar */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3.5 bg-primary text-background font-bold rounded-xl active:scale-98 transition-all shadow-md text-sm shrink-0 cursor-pointer"
                >
                    {t("Fechar", "Close")}
                </button>
            </div>
        </div>
    );
}

export default function DiagnosticosPage({ idPessoa }: { idPessoa: number }) {
    const { idioma, t } = useApp();
    const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [selecionado, setSelecionado] = useState<Diagnostico | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function carregarDiagnosticos() {
            setCarregando(true);
            setErro(null);

            try {
                const res = await fetch(`/api/diagnosticos?idPaciente=${idPessoa}`, {
                    signal: controller.signal,
                });

                if (!res.ok) throw new Error();

                const data: Diagnostico[] = await res.json();
                setDiagnosticos(data);
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== "AbortError") {
                    setErro(t("Não foi possível carregar os diagnósticos.", "Unable to load diagnostics."));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setCarregando(false);
                }
            }
        }

        carregarDiagnosticos();
        return () => controller.abort();
    }, [idPessoa, t]);

    const formatarData = (iso: string) =>
        new Date(iso).toLocaleString(idioma === "pt" ? "pt-PT" : "en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="min-h-screen bg-background font-sans px-4 pt-4 pb-24 sm:max-w-md sm:mx-auto select-none touch-manipulation">
            <header className="mb-4">
                <h1 className="text-2xl font-extrabold tracking-tight text-text">
                    {t("Diagnósticos", "Diagnostics")}
                </h1>
                <p className="text-xs text-muted mt-0.5 font-medium">
                    {t("Histórico de consultas e medições", "Consultation and measurement history")}
                </p>
            </header>

            {erro && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl p-3.5 text-xs font-semibold text-center mb-4">
                    {erro}
                </div>
            )}

            {/* Skeleton Loading */}
            {carregando && (
                <div className="flex flex-col gap-2.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-background rounded-2xl border border-primary-outline/40 p-4 animate-pulse flex flex-col gap-2"
                        >
                            <div className="flex justify-between">
                                <div className="h-3.5 w-24 bg-primary/15 rounded" />
                                <div className="h-3 w-16 bg-primary/10 rounded" />
                            </div>
                            <div className="h-3 w-3/4 bg-primary/10 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Estado Vazio */}
            {!carregando && !erro && diagnosticos.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-background rounded-3xl border border-dashed border-primary-outline/60 my-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-text">
                        {t("Sem diagnósticos", "No diagnostics")}
                    </p>
                    <p className="text-xs text-muted mt-1">
                        {t("Ainda não existem registos de diagnósticos associados.", "There are no diagnostic records associated yet.")}
                    </p>
                </div>
            )}

            {/* Lista de Cards */}
            <div className="flex flex-col gap-2.5">
                {diagnosticos.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelecionado(d)}
                        className="text-left rounded-2xl p-3.5 bg-background border border-primary-outline/40 active:scale-[0.99] transition-all shadow-2xs hover:border-primary/30 cursor-pointer flex flex-col gap-1"
                    >
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                {t("Diagnóstico", "Diagnosis")} #{d.id}
                            </span>
                            <span className="text-[11px] font-medium text-muted shrink-0">
                                {formatarData(d.date)}
                            </span>
                        </div>
                        <p className="text-xs text-text font-medium truncate mt-0.5">
                            {d.status?.trim() ? d.status : t("Sem observações registadas", "No registered notes")}
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