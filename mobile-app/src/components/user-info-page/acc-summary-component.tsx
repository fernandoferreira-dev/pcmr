import '../../styles/user-info-styles/user-data-styles.css'

export default function AccountSummaryComponent() {
    return (
        <>
             <div className="user-info-main-box">
                <h2>Resumo da conta</h2>
                <div className="user-data-box">
                    <p>Estado: </p>
                    <p>Data de Nascimento: </p>
                </div>
            </div>
        </>
    )
}
