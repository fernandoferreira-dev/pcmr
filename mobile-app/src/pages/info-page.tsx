import UserDataComponent from '../components/user-info-page/user-data-component'
import AccountSummaryComponent from '../components/user-info-page/acc-summary-component'
import LangPrefComponent from '../components/user-info-page/lang-pref-component'

type Props = {
    username: string;
    phonenumber: string;
    email: string;
    birthDate: string;
    selectedOption: string;
};

export default function InfoPage({ username, phonenumber, email, birthDate, selectedOption }: Props) {
    return (
        <>
            <div className="user-info-wrapper">
               <UserDataComponent username={username} phonenumber={phonenumber} email={email}/>
               <AccountSummaryComponent birthDate={birthDate}/>
               <LangPrefComponent selectedOption={selectedOption}/>
            </div>
        </>
    )
}
