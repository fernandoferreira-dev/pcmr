import { useEffect, useState } from "react";
import "../../styles/misc/settings-btn-styles.css"


export default function SendEmailButtonComponent() {
    
    const [isOpen, setIsOpen] = useState(false);
    const [darkEnabled, setIsEnabled] = useState(false);
    const [selectedOption, setSelectedOption] = useState("opcao1");

    useEffect(() => {
      document.body.classList.toggle("dark-theme", darkEnabled);

      return () => {
        document.body.classList.remove("dark-theme");
      };
    }, [darkEnabled]);
    
    return(
        <>
            <div className="settings-container">
                <button onClick={() => setIsOpen(true)} className="settings-container-button">
                        <img className="settings-icon" alt="Settings"></img>
                </button>

                {isOpen && (
                  <div className="overlay">
                    <div className="modal">
                      <p>Definições</p>
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
                        <div className="option-container">
                          <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                            <option value="opcao1">Português</option>
                            <option value="opcao2">Inglês</option>
                            <option value="opcao3">Espanhol</option>
                          </select>
                          <p>Preferência de Linguagem</p>
                        </div>
                    </div>
                      <button className="log-out-btn">Terminar Sessão</button>
                      <button onClick={() => setIsOpen(false)}>Close</button>
                    </div>
                  </div>
                )}
            </div>
        </>
    )
}