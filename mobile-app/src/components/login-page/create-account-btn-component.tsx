import { useState, type FormEvent } from "react";
import "../../styles/login-page/login-page-styles.css";
import "../../styles/misc/settings-btn-styles.css";

type UserProfile = {
  username: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  selectedOption: string;
};

type Props = {
  onAccountCreated?: (profile: UserProfile) => void;
};

export default function CreateAccountComponent({ onAccountCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("opcao-pt");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const currentDate = new Date();
  const maxDate = currentDate.toISOString().split("T")[0];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Registration form submitted", { username, email });
    setIsSubmitting(true);
    setFeedback("");

    try {
      const params = new URLSearchParams();
      params.append("name", username);
      params.append("email", email);
      params.append("password", password);

      console.log("Sending registration request to API...");
      const response = await fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const responseText = await response.text();
      console.log("Registration response received", {
        status: response.status,
        body: responseText,
      });

      if (!response.ok) {
        throw new Error(responseText || "Erro ao criar conta");
      }

      console.log("Account created successfully", { username, email });
      onAccountCreated?.({
        username,
        phoneNumber,
        email,
        birthDate,
        selectedOption,
      });
      setFeedback("Conta criada com sucesso!");
      setIsOpen(false);
      setUsername("");
      setPhoneNumber("");
      setEmail("");
      setBirthDate("");
      setPassword("");
      setSelectedOption("opcao-pt");
    } catch (error) {
      console.error("Registration request failed", error);
      setFeedback(
        error instanceof Error ? error.message : "Erro ao criar conta",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/*Nome Numero Email Data de Nascimento e Preferencia de Idioma*/}
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
              <form onSubmit={handleSubmit}>
                <div>
                  <label className="option-container">
                    Nome de Utilizador:
                    <input
                      className="input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Número de Telemóvel:
                    <input
                      className="input"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Email:
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Palavra-passe:
                    <input
                      className="input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="option-container">
                    Data de Nascimento:
                    <input
                      type="date"
                      min="1950-01-01"
                      max={maxDate}
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
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
                {feedback && <p>{feedback}</p>}
                <button className="btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A criar..." : "Criar Conta"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                >
                  Close
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
