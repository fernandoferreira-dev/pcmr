import "../../styles/diagnostic-data-styles/data-table-styles.css";

export default function DiagnosticsTableComponent() {
    return(
        <>
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
                        <tr>
                            <td>Paciente1</td>
                            <td>08:00 - 08:20</td>
                            <td>25°C</td>
                            <td>70 bpm</td>
                            <td>5.0</td>
                            <td>Pressão arterial alta</td>
                        </tr>
                        <tr>
                            <td>Paciente2</td>
                            <td>09:00 - 09:10</td>
                            <td>26°C</td>
                            <td>75 bpm</td>
                            <td>5.5</td>
                            <td>Pressão arterial baixa</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}