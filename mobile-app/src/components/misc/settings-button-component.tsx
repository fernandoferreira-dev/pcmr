import { useState } from "react";
import SettingsIcon from "../../assets/settings-icon.png"
import "../../styles/misc/settings-btn-styles.css"

export default function SettingsButtonComponent() {
    const [isOpen, setIsOpen] = useState(false);
    const [darkEnabled, setIsEnabled] = useState(false);
    
    return(
        <>
            <div className="settings-container">
                <button onClick={() => setIsOpen(true)} className="settings-container-button">
                        <img className="settings-icon" src={SettingsIcon} alt="Settings"></img>
                </button>

                {isOpen && (
                  <div className="overlay">
                    <div className="modal">
                      <p>Definições</p>
                      <div className="settings">
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
                      <button onClick={() => setIsOpen(false)}>Close</button>
                    </div>
                  </div>
                )}
            </div>
        </>
    )
}