import { useEffect, useState } from "react";
import SettingsIcon from "../../assets/settings.png"
import "../../styles/misc/settings-btn-styles.css"
import "../../styles/login-page/login-page-styles.css"
import { useAuth } from "../../context/auth-context";

export default function SettingsButtonComponent() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [darkEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkTheme");

    if (saved !== null) {
      return saved === "true";
    }

    //defaults to the prefered theme set by the browser
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

  }); const [selectedOption, setSelectedOption] = useState("opcao1");

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkEnabled);
    localStorage.setItem("darkTheme", String(darkEnabled));
  }, [darkEnabled]);

  return (
    <>
      <div className="settings-container">
        <button onClick={() => setIsOpen(true)} className="settings-container-button">
          <img className="settings-icon" src={SettingsIcon} alt="Settings"></img>
        </button>

        {isOpen && (
          <div className="overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Definições</h2>
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
                  <p>Modo Escuro</p>
                </div>
                <div className="option-seperator" />
                <div className="option-container">
                  <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                    <option value="opcao1">Português</option>
                    <option value="opcao2">Inglês</option>
                    <option value="opcao3">Espanhol</option>
                  </select>
                  <p>Preferência de Linguagem</p>
                </div>
              </div>
              <div className="option-seperator" />
              <button className="log-out-btn" onClick={() => { setIsOpen(false); logout(); }}>Terminar Sessão</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}