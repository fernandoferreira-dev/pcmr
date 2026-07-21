import { useState } from "react";
import "../styles/login-page/login-page-styles.css";
import LoginButtonComponent from "../components/login-page/login-button-component";
import appImage from "../assets/logo.png";
import RegisterButtonComponent from "../components/login-page/register-button-component";
import CreateAccountComponent from "../components/login-page/create-account-btn-component";

type UserProfile = {
  username: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  selectedOption: string;
  userId?: number | null;
};

type Props = {
  onLogin: (profile: UserProfile) => void;
  onAccountCreated?: (profile: UserProfile) => void;
};

export default function LoginPage({ onLogin, onAccountCreated }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //Estados do registo de medicos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoUsername, setNovoUsername] = useState("");
  const [novaPassword, setNovaPassword] = useState("");
  const [modalStatus, setModalStatus] = useState<{ tipo: 'erro' | 'sucesso', msg: string } | null>(null);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Nome de utilizador ou palavra-passe vazias");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || "Parâmetros inválidos");
      }

      let loginData: { nome?: string; userId?: number } | null = null;

      try {
        loginData = JSON.parse(responseText);
      } catch {
        loginData = null;
      }

      onLogin({
        username: loginData?.nome || username.trim(),
        phoneNumber: "",
        email: "",
        birthDate: "",
        selectedOption: "opcao-pt",
        userId: loginData?.userId ?? null,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login Falhou");
    } finally {
      setIsSubmitting(false);
    }
  };

  const solicitarCriacaoMedico = async () => {
    setModalStatus(null);
    if (!novoNome || !novoEmail || !novoUsername || !novaPassword) {
      setModalStatus({ tipo: 'erro', msg: 'Todos os campos são obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registo/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
          username: novoUsername,
          password: novaPassword
        }),
      });

      if (res.ok) {
        setModalStatus({ tipo: 'sucesso', msg: 'Pedido enviado! Espere que o Administrador aceite o seu pedido!' });
        setNovoNome("");
        setNovoEmail("");
        setNovoUsername("");
        setNovaPassword("");
        setTimeout(() => setIsModalOpen(false), 3000);
      } else {
        const data = await res.json();
        setModalStatus({ tipo: 'erro', msg: data.erro || "Erro ao solicitar criação." });
      }
    } catch {
      setModalStatus({ tipo: 'erro', msg: 'Falha de comunicação com o servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <>
      <h1 style={{ color: "#4E5452" }}>Medycist</h1>
      <div className="login-wrapper">
        <div>
          <img
            src={appImage}
            alt="Illustrative image"
            className="app-logo"
          />
        </div>
        <div className="login-page">
          <label htmlFor="username" style={{ marginTop: "1rem" }}>
            Username
          </label>
          <input
            className="input"
            id="username"
            name="username"
            type="text"
            value={username}
            required
            disabled={isSubmitting}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            value={password}
            disabled={isSubmitting}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="button-row">
            <LoginButtonComponent
              onClick={handleLogin}
              disabled={isSubmitting}
              label={isSubmitting ? "A Entrar..." : "Login"}
            />
            <CreateAccountComponent
              onAccountCreated={onAccountCreated}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="registerbtn"
          >
            Solicitar conta de Médico
          </button>
          {errorMessage && (
            <p className="error-message" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
      {/*popup do registo de medico*/}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Nova Conta de Médico</h3>
            <p className="modal-subtitle">Preencha os dados. O pedido será enviado ao administrador para aprovação.</p>
            <input
              className="modal-input"
              placeholder="Nome Completo"
              value={novoNome} onChange={e => setNovoNome(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <input
              className="modal-input"
              placeholder="Email"
              type="email"
              value={novoEmail} onChange={e => setNovoEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <input
              className="modal-input"
              placeholder="Username"
              value={novoUsername} onChange={e => setNovoUsername(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <input
              className="modal-input"
              placeholder="Password"
              type="password"
              value={novaPassword} onChange={e => setNovaPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            {modalStatus && (
              <div className={`modal-status ${modalStatus.tipo === 'erro' ? 'modal-status-erro' : 'modal-status-sucesso'}`}>
                {modalStatus.msg}
              </div>
            )}
            <div className="modal-actions">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={solicitarCriacaoMedico}
                disabled={isSubmitting}
                className="btn-enviar"
              >
                {isSubmitting ? "A enviar..." : "Enviar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
