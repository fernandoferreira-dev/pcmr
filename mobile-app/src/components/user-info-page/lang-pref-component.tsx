import '../../styles/user-info-styles/user-data-styles.css'
import { useTranslation } from "react-i18next";

type Props = { selectedOption: string };

export default function LangPrefComponent({ selectedOption }: Props) {
    const { t } = useTranslation();
    return (
        <>
            <div className="user-info-main-box">
                <div className="user-data-box">
                    <h2>{t('personalData.languagePreference')}</h2>
                    <p>{selectedOption}</p>
                </div>
            </div>

        </>
    )
}