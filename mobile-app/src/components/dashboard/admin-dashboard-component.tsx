// dashboard component
import { useState, useEffect } from 'react';
import DiagnosticButtonComponent from './diagnostic-button-component';
import PresencaToastComponent from './presenca-toast-component';
import '../../styles/dashboard-styles/dashboard-styles.css';
import '../../styles/dashboard-styles/notification-box.css';
import NotificationBoxComponent from './notifications-box-component';
import { useAuth } from '../../context/auth-context';

type Props = { username: string };

interface SensorDTO {
  idSensor: number;
  nome: string;
  localizacao: string;
  estado: string;
}

interface EstadoSensorDTO {
  deviceId: string;
  online: boolean;
  ultimaLeitura: string | null;
  segundosDesdeUltimaLeitura: number;
}

export default function AdminDashboardComponent({ username }: Props) {
  const isServerOk = true;
  const { user } = useAuth();
  const userId = user?.userId ?? null;

  const [sensorSelecionado, setSensorSelecionado] = useState<SensorDTO | null>(null);
  const [estadoPing, setEstadoPing] = useState<EstadoSensorDTO | null>(null);

  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const testarConexao = () => {
    fetch(`/api/sensores/1/ping`) //mudar mais logo quando o lambido do fernando ligar o servidor
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: EstadoSensorDTO) => setEstadoPing(data))
      .catch(() => setEstadoPing(null));
  };

  // corre uma vez quando o estado renderiza na pagina
  // pode causar problema se a coisa morrer enquanto o utilizador ta a usar app
  useEffect(() => {
    testarConexao();
  }, []);

  const isSensorOk = estadoPing?.online ?? false;

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
          <PresencaToastComponent />
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