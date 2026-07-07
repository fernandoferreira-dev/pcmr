import { useState } from "react";
import "../../styles/diagnostic-data-styles/data-table-styles.css";

interface Diagnostic {
    patient: string;
    time: string;
    temperature: string;
    bpm: string;
    magnitude: number;
    cause: string;
}

export default function DiagnosticsTableComponent() {
    const [search, setSearch] = useState("");

    const diagnostics: Diagnostic[] = [
        {
            patient: "Paciente1",
            time: "08:00 - 08:20",
            temperature: "25°C",
            bpm: "70 bpm",
            magnitude: 5.0,
            cause: "Pressão arterial alta",
        },
        {
            patient: "Paciente2",
            time: "09:00 - 09:10",
            temperature: "26°C",
            bpm: "75 bpm",
            magnitude: 5.5,
            cause: "Pressão arterial baixa",
        },
    ];

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

                <button className="search-button">Buscar</button>
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