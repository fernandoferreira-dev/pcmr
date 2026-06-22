import StatusButtonComponent from '../components/status-page-components/status-button-component'
import SearchBarComponent from '../components/status-page-components/search-bar-component'
import StatusPingComponent from '../components/status-page-components/status-ping-component'

export default function StatusPage() {
    return (
        <>
            <h1 className="status-header">Dados de equipamentos</h1>
            <div className="status-main-box">
                <StatusButtonComponent/>
                <SearchBarComponent/>
                <StatusPingComponent/>
            </div>
        </>
    )
}
