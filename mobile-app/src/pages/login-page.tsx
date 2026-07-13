import { useState } from "react";
import "../styles/login-page/login-page-styles.css";
import LoginButtonComponent from "../components/login-page/login-button-component";
import FooterComponent from "../components/misc/footer-component";
import appImage from "../assets/medycist_logo.png";
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
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            value={password}
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
          <RegisterButtonComponent />
          {errorMessage && (
            <p className="error-message" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
      <FooterComponent />
    </>
  );
}