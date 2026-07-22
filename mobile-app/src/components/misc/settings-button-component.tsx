import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SettingsIcon from "../../assets/settings.png"
import "../../styles/misc/settings-btn-styles.css"
import "../../styles/login-page/login-page-styles.css"
import { useAuth } from "../../context/auth-context";

export default function SettingsButtonComponent() {
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [darkEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkTheme");

    if (saved !== null) {
      return saved === "true";
    }

    //defaults to the prefered theme set by the browser
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkEnabled);
    localStorage.setItem("darkTheme", String(darkEnabled));
  }, [darkEnabled]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value; // "pt" or "en"
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <>
      <div className="settings-container">
        <button onClick={() => setIsOpen(true)} className="settings-container-button">
          <img className="settings-icon" src={SettingsIcon} alt={t('settings.iconAlt')}></img>
        </button>

        {isOpen && (
          <div className="overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{t('settings.title')}</h2>
                <button onClick={() => setIsOpen(false)} className="modal-close-btn">✕</button>
              </div>

              <div className="settings">
                <div className="option-container">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={darkEnabled}
                      onChange={() => setIsEnabled(!darkEnabled)}
                    />
                    <span className="slider"></span>
                  </label>
                  <p>{t('settings.darkMode')}</p>
                </div>
                <div className="option-seperator" />
                <div className="option-container">
                  <select value={i18n.language} onChange={handleLanguageChange}>
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                  </select>
                  <p>{t('settings.languagePreference')}</p>
                </div>
              </div>
              <div className="option-seperator" />
              <button className="log-out-btn" onClick={() => { setIsOpen(false); logout(); }}>
                {t('settings.logOut')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}