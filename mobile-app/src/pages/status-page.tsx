import StatusButtonComponent from '../components/status-page-components/status-button-component'
import SearchBarComponent from '../components/status-page-components/search-bar-component'
import StatusPingComponent from '../components/status-page-components/status-ping-component'

export default function StatusPage() {
    return (
        <>
            <div className="status-main-box">
                <StatusButtonComponent/>
                <SearchBarComponent/>
                <StatusPingComponent/>
            </div>
        </>
    )
}
