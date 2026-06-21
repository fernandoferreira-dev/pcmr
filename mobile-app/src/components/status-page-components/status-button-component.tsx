import '../../styles/status-page-styles/status-btn-styles.css'
import StatusPingImg from '../../assets/status-ping.png'

export default function StatusButtonComponent() {
    return (
        <>
            <div className="status-btn-box">
                <img src={StatusPingImg} alt="Status Ping"/>
                <button>
                    Testar Conexão
                </button>
            </div>
        </>
    )
}
