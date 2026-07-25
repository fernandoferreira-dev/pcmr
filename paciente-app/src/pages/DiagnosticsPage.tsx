import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "../assets/styles/index.css";

type Diagnostic = {
    id: number;
    patient: string;
    date: string;
    status: string;
    cause: string;
};

type DiagnosticoResponseDTO = {
    id: number;
    patient: string;
    date: string;
    status: string;
    relacaoCausaEfeito: string;
};

type PontoHistorico = {
    gdhLeitura: string;
    temperatura: number;
    bpm: number;
    magnitudeG: number;
};

type SensorStat = {
    min: number;
    max: number;
    avg: number;
};

type DiagnosticStats = {
    temperatura: SensorStat;
    bpm: SensorStat;
    magnitudeG: SensorStat;
};

function calcularStats(valores: number[]): SensorStat {
    if (!valores.length) {
        return { min: 0, max: 0, avg: 0 };
    }

    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const avg = valores.reduce((soma, valor) => soma + valor, 0) / valores.length;

    return { min, max, avg };
}

type ModalProps = {
    diagnostic: Diagnostic;
    onClose: () => void;
};

function DiagnosticoDetalheModal({ diagnostic, onClose }: ModalProps) {
    const { idioma, t } = useApp();
    const [modalLoading, setModalLoading] = useState(true);
    const [modalError, setModalError] = useState<string | null>(null);
    const [stats, setStats] = useState<DiagnosticStats | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchHistorico() {
            setModalLoading(true);
            setModalError(null);

            try {
                const response = await fetch(`/api/diagnosticos/${diagnostic.id}/historico`, {
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error();

                const historico = (await response.json()) as PontoHistorico[];

                const temperaturas = historico.map((ponto) => ponto.temperatura);
                const bpms = historico.map((ponto) => ponto.bpm);
                const magnitudes = historico.map((ponto) => ponto.magnitudeG);

                setStats({
                    temperatura: calcularStats(temperaturas),
                    bpm: calcularStats(bpms),
                    magnitudeG: calcularStats(magnitudes),
                });
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== "AbortError") {
                    setModalError(t("Não foi possível carregar os dados do diagnóstico.", "Unable to load diagnostic data."));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setModalLoading(false);
                }
            }
        }

        fetchHistorico();
        return () => controller.abort();
    }, [diagnostic.id, t]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString(idioma === "pt" ? "pt-PT" : "en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 bg-background rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col font-sans border border-primary-outline/20">

                {/* Cabeçalho */}
                <div className="flex items-center justify-between pb-4 border-b border-primary-outline/20">
                    <h2 className="text-lg font-bold text-text">
                        {t("Relatório de Diagnóstico", "Diagnostic Report")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-text transition-colors cursor-pointer p-1"
                        aria-label={t("Fechar", "Close")}
                    >
                        ✕
                    </button>
                </div>

                {modalLoading && (
                    <div className="py-12 text-center text-sm text-muted">
                        {t("A carregar detalhes...", "Loading details...")}
                    </div>
                )}

                {modalError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl p-3 text-xs font-semibold text-center my-4">
                        {modalError}
                    </div>
                )}

                {!modalLoading && !modalError && (
                    <>
                        {/* Informações Principais */}
                        <div className="py-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center border-b border-primary-outline/10 pb-2">
                                <span className="text-muted">{t("Diagnóstico", "Diagnosis")}</span>
                                <span className="font-semibold text-text">#{diagnostic.id}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-primary-outline/10 pb-2">
                                <span className="text-muted">{t("Paciente", "Patient")}</span>
                                <span className="font-semibold text-text">{diagnostic.patient || "Ana Ferreira"}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-primary-outline/10 pb-2">
                                <span className="text-muted">{t("Horário", "Time")}</span>
                                <span className="font-semibold text-text">{formatDate(diagnostic.date)}</span>
                            </div>

                            <div className="flex justify-between items-start gap-4 pb-2">
                                <span className="text-muted shrink-0">{t("Observações", "Observations")}</span>
                                <span className="text-right font-medium text-text text-xs leading-relaxed max-w-65">
                                    {diagnostic.status?.trim()
                                        ? diagnostic.status
                                        : t("Sem observações registadas.", "No observations registered.")}
                                </span>
                            </div>
                        </div>

                        {/* Evolução dos Sensores */}
                        {stats && (
                            <div className="mt-2 pt-2">
                                <h3 className="text-center font-bold text-text text-sm mb-4">
                                    {t("Evolução dos Sensores", "Sensor Evolution")}
                                </h3>

                                <div className="grid grid-cols-4 text-xs font-semibold text-muted pb-2 border-b border-primary-outline/10 text-right">
                                    <div className="text-left"></div>
                                    <div>{t("MÍN.", "MIN.")}</div>
                                    <div>{t("MÉDIA", "AVG.")}</div>
                                    <div>{t("MÁX.", "MAX.")}</div>
                                </div>

                                <div className="space-y-3 pt-3 text-xs text-text">
                                    <div className="grid grid-cols-4 items-center text-right">
                                        <span className="text-left font-medium text-muted">
                                            {t("Temperatura (°C)", "Temperature (°C)")}
                                        </span>
                                        <span>{stats.temperatura.min.toFixed(1)}</span>
                                        <span>{stats.temperatura.avg.toFixed(1)}</span>
                                        <span>{stats.temperatura.max.toFixed(1)}</span>
                                    </div>

                                    <div className="grid grid-cols-4 items-center text-right border-t border-primary-outline/10 pt-3">
                                        <span className="text-left font-medium text-muted">BPM</span>
                                        <span>{stats.bpm.min.toFixed(0)}</span>
                                        <span>{stats.bpm.avg.toFixed(0)}</span>
                                        <span>{stats.bpm.max.toFixed(0)}</span>
                                    </div>

                                    <div className="grid grid-cols-4 items-center text-right border-t border-primary-outline/10 pt-3">
                                        <span className="text-left font-medium text-muted">
                                            {t("Magnitude (G)", "Magnitude (G)")}
                                        </span>
                                        <span>{stats.magnitudeG.min.toFixed(2)}</span>
                                        <span>{stats.magnitudeG.avg.toFixed(2)}</span>
                                        <span>{stats.magnitudeG.max.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function DiagnosticsPage({ personId }: { personId: number }) {
    const { idioma, t } = useApp();
    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchDiagnostics() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/diagnosticos?idPaciente=${personId}`, {
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error();

                const data: DiagnosticoResponseDTO[] = await response.json();

                const diagnosticsMapped: Diagnostic[] = data.map((item) => ({
                    id: item.id,
                    patient: item.patient || "",
                    date: item.date || "",
                    status: item.status || "",
                    cause: item.relacaoCausaEfeito || "",
                }));

                setDiagnostics(diagnosticsMapped);
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== "AbortError") {
                    setError(t("Não foi possível carregar os diagnósticos.", "Unable to load diagnostics."));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        fetchDiagnostics();
        return () => controller.abort();
    }, [personId, t]);

    const formatDate = (iso: string) =>
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

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl p-3.5 text-xs font-semibold text-center mb-4">
                    {error}
                </div>
            )}

            {isLoading && (
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

            {!isLoading && !error && diagnostics.length === 0 && (
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

            <div className="flex flex-col gap-2.5">
                {diagnostics.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setSelectedDiagnostic(item)}
                        className="text-left rounded-2xl p-3.5 bg-background border border-primary-outline/40 active:scale-[0.99] transition-all shadow-2xs hover:border-primary/30 cursor-pointer flex flex-col gap-1"
                    >
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                {t("Diagnóstico", "Diagnosis")} :
                            </span>
                            <span className="text-[11px] font-medium text-muted shrink-0">
                                {formatDate(item.date)}
                            </span>
                        </div>
                        <p className="text-xs text-text font-medium truncate mt-0.5">
                            {item.status?.trim() ? item.status : t("Sem observações registadas", "No registered notes")}
                        </p>
                    </button>
                ))}
            </div>

            {selectedDiagnostic && (
                <DiagnosticoDetalheModal
                    diagnostic={selectedDiagnostic}
                    onClose={() => setSelectedDiagnostic(null)}
                />
            )}
        </div>
    );
}