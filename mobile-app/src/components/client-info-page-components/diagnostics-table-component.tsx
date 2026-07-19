import { useEffect, useState } from "react";
import "../../styles/diagnostic-data-styles/data-table-styles.css";

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

// TODO: replace with your real deployed backend URL (not localhost)
const API_BASE_URL = "http://localhost:8080";

const EXPORT_BASE_URL = `${window.location.origin}${import.meta.env.BASE_URL}export`.replace(/([^:])\/{2,}/g, "$1/");

// Lets AppInventor's injected object be referenced without a TS error
declare global {
    interface Window {
        AppInventor?: {
            setWebViewString: (value: string) => void;
        };
    }
}

export default function DiagnosticsTableComponent() {
    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const loadDiagnostics = () => {
        setLoading(true);

        fetch(`${API_BASE_URL}/api/diagnosticos`)
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

    const handleExportClick = (diagnostic: Diagnostic) => {
        const exportUrl = `${EXPORT_BASE_URL}/${diagnostic.id}`;

        if (window.AppInventor) {
            window.AppInventor.setWebViewString(exportUrl);
        } else {
            window.open(exportUrl, "_blank");
        }
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
                    Atualizar
                </button>
            </div>
            {error && <div className="dashboard-error">{error}</div>}
            <section className="table-section">
                <h1 className="table-title">Histórico de Diagnósticos</h1>
                <div className="table-wrapper">
                    <div className="table-scroll">
                        <div className="table-container">
                            <div className="table-header">
                                <span>Paciente</span>
                                <span>Horário</span>
                                <span>Observações</span>
                                <span>Causa-Efeito</span>
                            </div>
                            <div className="table-body">
                                {loading ? (
                                    <p className="table-loading">A carregar dados...</p>
                                ) : filteredDiagnostics.length === 0 ? (
                                    <p className="table-empty">
                                        Nenhum diagnóstico encontrado.
                                    </p>
                                ) : (
                                    filteredDiagnostics.map((diagnostic) => (
                                        <div key={diagnostic.id} className="table-row">
                                            <div className="table-patient">
                                                <button
                                                    className="export-button"
                                                    onClick={() => handleExportClick(diagnostic)}
                                                >
                                                    Exportar
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
        </>
    );
}