import { useState } from "react";
import LoginPage from "./pages/login-page";
import MainPage from "./pages/main-page";

function App() {
  const [page, setPage] = useState<"login" | "dashboard">("login");

  return page === "login" ? (
    <LoginPage onLogin={() => setPage("dashboard")} />
  ) : (
    <MainPage />
  );
}

export default App;
