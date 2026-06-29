import UserCounterComponent from "../components/client-info-page-components/user-counter-component"
import DiagnosticCounterComponent from "../components/client-info-page-components/diagnostic-counter-component"
import "../styles/diagnostic-data-styles/data-containers-styles.css"

export default function ClientInfoPage() {
    return (
        <>
            <div className="data-wrapper">
                <UserCounterComponent/>
                <DiagnosticCounterComponent/>
            </div>
        </>
    )
}
