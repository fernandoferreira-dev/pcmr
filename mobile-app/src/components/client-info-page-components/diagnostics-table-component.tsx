import { useEffect, useState } from "react";
import "../../styles/diagnostic-data-styles/data-table-styles.css";
import "../../styles/diagnostic-data-styles/diagnostic-modal-styles.css";
import { useTranslation } from "react-i18next";

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

export default function DiagnosticsTableComponent() {
    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const { t } = useTranslation();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null);
    const [stats, setStats] = useState<DiagnosticStats | null>(null);

    const loadDiagnostics = () => {
        setLoading(true);

        fetch(`/api/diagnosticos`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Unable to load diagnostics");
                }

                const data = (await response.json()) as DiagnosticoResponseDTO[];

                const diagnosticsMapped: Diagnostic[] = data.map((item) => ({
                    id: item.id,
                    patient: item.patient || "",
                    date: item.date || "",
                    status: item.status || "",
                    cause: item.relacaoCausaEfeito || "",
                }));

                setDiagnostics(diagnosticsMapped);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError("Não foi possível carregar os diagnósticos.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadDiagnostics();
    }, []);

    const formatDate = (isoDate: string) => {
        if (!isoDate) return "";

        const parsed = new Date(isoDate);

        if (isNaN(parsed.getTime())) return isoDate;

        return (
            parsed.toLocaleDateString("pt-PT") +
            " " +
            parsed.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    };

    const filteredDiagnostics = diagnostics.filter((diagnostic) => {
        const query = search.toLowerCase();
        return (
            diagnostic.patient.toLowerCase().includes(query) ||
            formatDate(diagnostic.date).toLowerCase().includes(query) ||
            diagnostic.status.toLowerCase().includes(query) ||
            diagnostic.cause.toLowerCase().includes(query)
        );
    });

    // Replaces the old "export to PDF" flow: fetches the same /historico
    // endpoint and opens a modal with min/avg/max instead of a chart+PDF.
    const handleViewDetails = async (diagnostic: Diagnostic) => {
        setSelectedDiagnostic(diagnostic);
        setModalOpen(true);
        setModalLoading(true);
        setModalError(null);
        setStats(null);

        try {
            const response = await fetch(`/api/diagnosticos/${diagnostic.id}/historico`);

            if (!response.ok) {
                throw new Error("Falha ao obter histórico.");
            }

            const historico = (await response.json()) as PontoHistorico[];

            const temperaturas = historico.map((ponto) => ponto.temperatura);
            const bpms = historico.map((ponto) => ponto.bpm);
            const magnitudes = historico.map((ponto) => ponto.magnitudeG);

            setStats({
                temperatura: calcularStats(temperaturas),
                bpm: calcularStats(bpms),
                magnitudeG: calcularStats(magnitudes),
            });
        } catch (err) {
            console.error(err);
            setModalError("Não foi possível carregar os dados do diagnóstico.");
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedDiagnostic(null);
        setStats(null);
        setModalError(null);
    };

    return (
        <>
            <div className="search-container">
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Filtrar consultas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="search-button" onClick={loadDiagnostics}>
                    {t('diagnostics.updateButton')}
                </button>
            </div>
            {error && <div className="dashboard-error">{error}</div>}
            <section className="table-section">
                <h1 className="table-title">{t('diagnostics.historyTitle')}</h1>
                <div className="table-wrapper">
                    <div className="table-scroll">
                        <div className="table-container">
                            <div className="table-header">
                                <span>{t('diagnostics.tablePatient')}</span>
                                <span>{t('diagnostics.tableTime')}</span>
                                <span>{t('diagnostics.tableObs')}</span>
                                <span>{t('diagnostics.tableCause')}</span>
                            </div>
                            <div className="table-body">
                                {loading ? (
                                    <p className="table-loading">{t('general.loading')}</p>
                                ) : filteredDiagnostics.length === 0 ? (
                                    <p className="table-empty">
                                        {t('general.diagNotFound')}
                                    </p>
                                ) : (
                                    filteredDiagnostics.map((diagnostic) => (
                                        <div key={diagnostic.id} className="table-row">
                                            <div className="table-patient">
                                                <button
                                                    className="export-button"
                                                    onClick={() => handleViewDetails(diagnostic)}
                                                >
                                                    {t('diagnostics.viewButton', 'Ver Detalhes')}
                                                </button>
                                                <span className="patient-name">
                                                    {diagnostic.patient}
                                                </span>
                                            </div>
                                            <span>{formatDate(diagnostic.date)}</span>
                                            <span
                                                className="table-status"
                                                title={diagnostic.status}
                                            >
                                                {diagnostic.status}
                                            </span>
                                            <span
                                                className="table-status"
                                                title={diagnostic.cause}
                                            >
                                                {diagnostic.cause}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {t('diagnostics.modalTitle', 'Relatório de Diagnóstico')}
                            </h2>
                            <button
                                className="modal-close"
                                onClick={closeModal}
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>

                        {modalLoading && (
                            <p className="modal-loading">{t('general.loading')}</p>
                        )}

                        {modalError && <p className="modal-error">{modalError}</p>}

                        {!modalLoading && !modalError && selectedDiagnostic && (
                            <div className="modal-body">
                                <div className="modal-info-row">
                                    <span className="modal-label">
                                        {t('diagnostics.modalId', 'Diagnóstico')}
                                    </span>
                                    <span className="modal-value">
                                        #{selectedDiagnostic.id}
                                    </span>
                                </div>
                                <div className="modal-info-row">
                                    <span className="modal-label">
                                        {t('diagnostics.tablePatient')}
                                    </span>
                                    <span className="modal-value">
                                        {selectedDiagnostic.patient}
                                    </span>
                                </div>
                                <div className="modal-info-row">
                                    <span className="modal-label">
                                        {t('diagnostics.tableTime')}
                                    </span>
                                    <span className="modal-value">
                                        {formatDate(selectedDiagnostic.date)}
                                    </span>
                                </div>
                                <div className="modal-info-row">
                                    <span className="modal-label">
                                        {t('diagnostics.tableObs')}
                                    </span>
                                    <span className="modal-value">
                                        {selectedDiagnostic.status || "-"}
                                    </span>
                                </div>

                                <div className="modal-divider" />

                                <h3 className="modal-subtitle">
                                    {t('diagnostics.modalSensorTitle', 'Evolução dos Sensores')}
                                </h3>

                                {stats && (
                                    <div className="modal-stats-table">
                                        <div className="modal-stats-header">
                                            <span></span>
                                            <span>{t('diagnostics.statMin', 'Mín.')}</span>
                                            <span>{t('diagnostics.statAvg', 'Média')}</span>
                                            <span>{t('diagnostics.statMax', 'Máx.')}</span>
                                        </div>

                                        <div className="modal-stats-row">
                                            <span className="modal-stats-label">
                                                {t('diagnostics.statTemp', 'Temperatura (°C)')}
                                            </span>
                                            <span>{stats.temperatura.min.toFixed(1)}</span>
                                            <span>{stats.temperatura.max.toFixed(1)}</span>
                                            <span>{stats.temperatura.avg.toFixed(1)}</span>
                                        </div>

                                        <div className="modal-stats-row">
                                            <span className="modal-stats-label">
                                                {t('diagnostics.statBpm', 'BPM')}
                                            </span>
                                            <span>{stats.bpm.min.toFixed(0)}</span>
                                            <span>{stats.bpm.max.toFixed(0)}</span>
                                            <span>{stats.bpm.avg.toFixed(0)}</span>
                                        </div>

                                        <div className="modal-stats-row">
                                            <span className="modal-stats-label">
                                                {t('diagnostics.statMag', 'Magnitude (G)')}
                                            </span>
                                            <span>{stats.magnitudeG.min.toFixed(2)}</span>
                                            <span>{stats.magnitudeG.max.toFixed(2)}</span>
                                            <span>{stats.magnitudeG.avg.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}