import { useState } from "react";
import AdminDashboardComponent from "../components/dashboard/admin-dashboard-component";
import NavBarComponent from "../components/misc/nav-bar-component";
import ContactPage from "./contact-page";
import StatusPage from "./status-page";
import InfoPage from "./info-page";
import ClientInfoPage from "./client-info-page";
import SettingsButtonComponent from "../components/misc/settings-button-component";
import SendEmailButtonComponent from "../components/misc/send-email-btn";
import "../styles/misc/header-styles.css";

type Props = { username: string; phonenumber: string; email: string; birthDate: string; selectedOption: string };

export default function MainPage({ username, phonenumber, email, birthDate, selectedOption }: Props) {
  const [view, setView] = useState<
    "home" | "comms" | "status" | "doctor" | "records"
  >("home");

  const pageTitles = {
    home: "Medycist - Dashboard",
    comms: "Medycist - Comunicação",
    status: "Medycist - Dados de Equipamentos",
    doctor: "Medycist - Dados Pessoais",
    records: "Medycist - Dados Diagnósticos",
  } as const;

  const renderView = () => {
    switch (view) {
      case "comms":
        return <ContactPage />;
      case "status":
        return <StatusPage />;
      case "doctor":
        return (
          <InfoPage
            username={username}
            phonenumber={phonenumber}
            email={email}
            birthDate={birthDate}
            selectedOption={selectedOption}
          />
        );
      case "records":
        return <ClientInfoPage />;
      default:
        return <AdminDashboardComponent />;
    }
  };

  return (
    <>
      <div className="header-container">
        <div className="header-row">
          <h1 className="header-page-title">{pageTitles[view]}</h1>
          <div className="buttons-row">
            <SettingsButtonComponent />
            <SendEmailButtonComponent />
          </div>
        </div>
      </div>
      <h1>Bem vindo, {username || "Admin"}</h1>
      {renderView()}
      <NavBarComponent onNavigate={setView} />
    </>
  );
}
