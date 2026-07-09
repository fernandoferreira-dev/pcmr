import { useEffect, useState } from "react";
import "../../styles/diagnostic-data-styles/data-table-styles.css";


type Diagnostic = {
    patient: string;
    time: string;
    temperature: string;
    bpm: string;
    magnitude: number;
    cause: string;
}

export default function DiagnosticsTableComponent() {

    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [patientLoaded, setPatientLoaded] = useState(false);
    const [search, setSearch] = useState("");

    const applyPatients = (patients: Diagnostic[]) => {
        setDiagnostics(patients);
    };

    const loadDiagnostics = () => {
        fetch(`http://localhost:8080/api/diagnostics`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Unable to load patients");
                }

                const data = (await response.json()) as Diagnostic[];

                const nextPatients: Diagnostic[] = data.map((item) => ({
                    patient: item.patient || "",
                    time: item.time || "",
                    temperature: item.temperature || "",
                    bpm: item.bpm || "",
                    magnitude: item.magnitude || 0,
                    cause: item.cause || "",
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


    const filteredDiagnostics = diagnostics.filter((diagnostic) => {
        const query = search.toLowerCase();

        return (
            diagnostic.patient.toLowerCase().includes(query) ||
            diagnostic.time.toLowerCase().includes(query) ||
            diagnostic.temperature.toLowerCase().includes(query) ||
            diagnostic.bpm.toLowerCase().includes(query) ||
            diagnostic.magnitude.toString().includes(query) ||
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
                            <th>Temperatura</th>
                            <th>Batimentos cardíacos</th>
                            <th>Magnitude</th>
                            <th>Causa-efeito</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredDiagnostics.map((diagnostic, index) => (
                            <tr key={index}>
                                <td>{diagnostic.patient}</td>
                                <td>{diagnostic.time}</td>
                                <td>{diagnostic.temperature}</td>
                                <td>{diagnostic.bpm}</td>
                                <td>{diagnostic.magnitude}</td>
                                <td>{diagnostic.cause}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}