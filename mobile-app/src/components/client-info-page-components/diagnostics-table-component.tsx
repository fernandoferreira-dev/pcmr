import { useEffect, useState } from "react";
import "../../styles/diagnostic-data-styles/data-table-styles.css";

type Diagnostic = {
    id: number;
    patient: string;
    date: string;
    status: string;
    cause: string;
}

type DiagnosticoResponseDTO = {
    id: number;
    patient: string;
    date: string;
    status: string;
    relacaoCausaEfeito: string;
}

export default function DiagnosticsTableComponent() {
    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [patientLoaded, setPatientLoaded] = useState(false);
    const [search, setSearch] = useState("");

    const applyPatients = (patients: Diagnostic[]) => {
        setDiagnostics(patients);
    };

    const loadDiagnostics = () => {
        fetch(`http://localhost:8080/api/diagnosticos`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Unable to load patients");
                }
                const data = (await response.json()) as DiagnosticoResponseDTO[];
                const nextPatients: Diagnostic[] = data.map((item) => ({
                    id: item.id,
                    patient: item.patient || "",
                    date: item.date || "",
                    status: item.status || "",
                    cause: item.relacaoCausaEfeito || "",
                }));
                applyPatients(nextPatients);
                sessionStorage.setItem('pacientes', JSON.stringify(nextPatients));
                setPatientLoaded(true);
            })
            .catch(() => {
                setPatientLoaded(true);
            });
    }

    useEffect(() => {
        loadDiagnostics();
    }, [patientLoaded]);

    const formatDate = (isoDate: string) => {
        if (!isoDate) return "";
        const parsed = new Date(isoDate);
        if (isNaN(parsed.getTime())) return isoDate;
        return parsed.toLocaleString();
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

    return (
        <>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Filtrar consultas..."
                    className="search-bar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="search-button" onClick={loadDiagnostics}>Atualizar</button>
            </div>
            <div className="tableContainer">
                <table className="patientsTable">
                    <thead>
                        <tr>
                            <th>Pacientes</th>
                            <th>Horário</th>
                            <th>Observações</th>
                            <th>Causa-efeito</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDiagnostics.map((diagnostic) => (
                            <tr key={diagnostic.id}>
                                <td>{diagnostic.patient}</td>
                                <td>{formatDate(diagnostic.date)}</td>
                                <td>{diagnostic.status}</td>
                                <td>{diagnostic.cause}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
