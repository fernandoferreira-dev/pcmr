import '../../styles/user-info-styles/user-data-styles.css'
import { useTranslation } from "react-i18next";

type Props = { birthDate: string };

export default function AccountSummaryComponent({ birthDate }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <div className="user-info-main-box">
                <h2>{t('personalData.accountSummary')}</h2>
                <div className="user-data-box">
                    <p>{t('personalData.status')}{t('personalData.statusActive')}</p>
                    <p>{t('personalData.dateOfBirth')}{birthDate}</p>
                </div>
            </div>
        </>
    )
}
