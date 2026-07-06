import '../../styles/user-info-styles/user-data-styles.css'

type Props = { birthDate: string };

export default function AccountSummaryComponent({ birthDate }: Props) {
    return (
        <>
             <div className="user-info-main-box">
                <h2>Resumo da conta</h2>
                <div className="user-data-box">
                    <p>Estado: Ativo</p>
                    <p>Data de Nascimento: {birthDate}</p>
                </div>
            </div>
        </>
    )
}
