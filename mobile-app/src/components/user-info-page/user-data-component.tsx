import '../../styles/user-info-styles/user-data-styles.css'
import { useTranslation } from "react-i18next";

type Props = { username: string; phonenumber: string; email: string };

export default function UserDataComponent({ username, phonenumber, email }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <div className="user-info-main-box">
                <div>
                    <div className="user-data-icon">
                        <img className="icon" />
                    </div>
                    <div className="user-data-box">
                        <h2>{t('personalData.username')}</h2>
                        <p>{username}</p>
                    </div>
                </div>
                <div>
                    <div className="user-data-icon">
                        <img className="icon" />
                    </div>
                    <div className="user-data-box">
                        <h2>{t('personalData.phoneNumber')}</h2>
                        <p>{phonenumber}</p>
                    </div>
                </div>
                <div>
                    <div className="user-data-icon">
                        <img className="icon" />
                    </div>
                    <div className="user-data-box">
                        <h2>Email:</h2>
                        <p>{email}</p>
                    </div>
                </div>
            </div>
        </>
    )
}
