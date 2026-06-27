import { useState } from "react";
import SettingsIcon from "../../assets/settings-icon.png"
import "../../styles/misc/settings-btn-styles.css"

export default function SettingsButtonComponent() {
    const [isOpen, setIsOpen] = useState(false);
    
    return(
        <>
            <div className="settings-container">
                <button onClick={() => setIsOpen(true)} className="settings-container-button">
                        <img className="settings-icon" src={SettingsIcon} alt="Settings"></img>
                </button>

                {isOpen && (
                  <div className="overlay">
                    <div className="modal">
                      <p>popup de teste</p>
                      <button onClick={() => setIsOpen(false)}>Close</button>
                    </div>
                  </div>
                )}
            </div>
        </>
    )
}