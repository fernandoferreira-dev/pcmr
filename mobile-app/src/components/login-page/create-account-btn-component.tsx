import { useState } from "react";
import "../../styles/login-page/login-page-styles.css";
import "../../styles/misc/settings-btn-styles.css";

export default function CreateAccountComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("opcao-pt");
  const currentDate = new Date();

  return (
    <>
      {/*Nome Numero Email Data de Nascimento e Preferencia de Idioma*/}
      <div className="settings-container">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
          className="btn"
        >
          Criar Conta
        </button>

        {isOpen && (
          <div className="overlay">
            <div className="modal">
              <p>Criação de Conta</p>
              <div className="settings">
                <div>
                  <label className="option-container">
                    Nome de Utilizador:
                    <input className="input"></input>
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Número de Telemóvel:
                    <input className="input"></input>
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Email:
                    <input className="input"></input>
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Data de Nascimento:
                    <input
                      type="date"
                      min="1950-01-01"
                      max={currentDate.toISOString()}
                    ></input>
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Preferência de Idioma:
                    <select
                      value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    >
                      <option value="opcao-pt">Português</option>
                      <option value="opcao-ing">Inglês</option>
                      <option value="opcao-esp">Espanhol</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
