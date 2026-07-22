import StatusPingComponent from '../components/status-page-components/status-ping-component'
import '../i18nConfig';

export default function StatusPage() {
    return (
        <>
            <div className="status-main-box">
                <StatusPingComponent/>
            </div>
        </>
    )
}
