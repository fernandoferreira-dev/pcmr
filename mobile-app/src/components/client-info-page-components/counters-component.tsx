import { useEffect, useState } from "react";
import "../../styles/diagnostic-data-styles/data-containers-styles.css";
import { useTranslation } from "react-i18next";

interface DashboardData {
    totalDiagnosticos: number;
    totalPacientes: number;
    diagnosticos: unknown[];
}

export default function CountersComponent() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                //const response = await fetch(`http://localhost:8080/api/diagnosticos/dashboard`);
                const response = await fetch(`/api/diagnosticos/dashboard`);
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                const result: DashboardData = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao carregar dados");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    return (
        <>
            <div className="data-wrapper">
                <div className="data-container">
                    <h2>{t('diagnostics.diagnosticsCount')}</h2>
                    <p>
                        {loading
                            ? "A carregar..."
                            : error
                                ? "Erro"
                                : data?.totalDiagnosticos}
                    </p>
                </div>
                <div className="data-container">
                    <h2>{t('diagnostics.usersCount')}</h2>
                    <p>
                        {loading
                            ? "A carregar..."
                            : error
                                ? "Erro"
                                : data?.totalPacientes}
                    </p>
                </div>
            </div>
        </>
    );
}
