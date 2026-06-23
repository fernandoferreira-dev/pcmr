import UserDataComponent from '../components/user-info-page/user-data-component'
import AccountSummaryComponent from '../components/user-info-page/acc-summary-component'

export default function InfoPage() {
    return (
        <>
            <h1 className="page-header">Dados Pessoais</h1>
            <div className="user-info-wrapper">
               <UserDataComponent/>
               <AccountSummaryComponent/>
            </div>
        </>
    )
}
