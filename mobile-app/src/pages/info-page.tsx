import UserDataComponent from '../components/user-info-page/user-data-component'
import AccountSummaryComponent from '../components/user-info-page/acc-summary-component'
import LangPrefComponent from '../components/user-info-page/lang-pref-component'

export default function InfoPage() {
    return (
        <>
            <div className="user-info-wrapper">
               <UserDataComponent/>
               <AccountSummaryComponent/>
               <LangPrefComponent/>
            </div>
        </>
    )
}
