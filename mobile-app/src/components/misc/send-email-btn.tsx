import { useState } from "react";
import "../../styles/misc/settings-btn-styles.css"
import SendIcon from "../../assets/send-icon.png"
import EmailIcon from "../../assets/email-icon.png"

export default function SendEmailButtonComponent() {    
    const [isOpen, setIsOpen] = useState(false);
  
    return(
        <>
            <div className="settings-container">
              <button onClick={() => setIsOpen(true)} className="settings-container-button">
                <img className="settings-icon" src={EmailIcon} alt="Email"></img>
              </button>
                {isOpen && (
                  <div className="overlay">
                    <div className="modal">
                      <p>| Enviar Email |</p>
                      <div className="settings">
                        <div className="option-container">
                          <label>Corpo da mensagem: 
                            <input className="message-body"/>
                          </label>
                        </div>
                        <div className="settings-container">
                          <button className="settings-container-button">
                            <img src={SendIcon} alt="Enviar Email" className="settings-icon"></img>       
                          </button>
                        </div>
                    </div>
                      <button onClick={() => setIsOpen(false)}>Close</button>
                    </div>
                  </div>
                )}
            </div>
        </>
    )
}