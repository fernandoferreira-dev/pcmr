import CountersComponent from "../components/client-info-page-components/counters-component"
import DiagnosticsTableComponent from "../components/client-info-page-components/diagnostics-table-component"
import "../styles/diagnostic-data-styles/data-containers-styles.css"

export default function ClientInfoPage() {
    return (
        <>
            <div className="data-wrapper">
                <CountersComponent/>
                <DiagnosticsTableComponent/>
            </div>
        </>
    )
}
