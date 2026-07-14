// dashboard component
import { useState } from 'react';
import DiagnosticButtonComponent from './diagnostic-button-component';
import '../../styles/dashboard-styles/dashboard-styles.css';
import '../../styles/dashboard-styles/notification-box.css';
import NotificationBoxComponent from './notifications-box-component';
import { useAuth } from '../../context/auth-context';

type Props = { username: string };

export default function AdminDashboardComponent({ username }: Props) {
  const isServerOk = true;
  const isSensorOk = true;
  const { user } = useAuth();
  const userId = user?.userId ?? null;

  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const getStatusStyle = (isOk: boolean) => {
    switch (isOk) {
      case true:
        return { backgroundColor: 'green', borderColor: 'green' };
      case false:
        return { backgroundColor: 'red', borderColor: 'red' };
      default:
        return {};
    }
  };

  return (
    <>
      <div className="main-page">
        <h1>Bem vindo, {username || "Admin"}</h1>
        <div className="mainbox">
          <button onClick={() => setIsDiagnosticOpen(true)} className="diagnosticbtn">
            Consulta Rápida
          </button>

          {isDiagnosticOpen && userId !== null && (
            <DiagnosticButtonComponent
              onClose={() => setIsDiagnosticOpen(false)}
              idMedico={userId}
            />
          )}

          <div className="main-page-states">
            <div className="main-page-states-box">
              <h2>Estado do servidor: </h2>
              <div className="OKstate" style={getStatusStyle(isServerOk)}></div>
            </div>
            <div className="main-page-states-box">
              <h2>Estado do sensor nó: </h2>
              <div className="OKstate" style={getStatusStyle(isSensorOk)}></div>
            </div>
          </div>
          <NotificationBoxComponent />
        </div>
      </div>
    </>
  );
}