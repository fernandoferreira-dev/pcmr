import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import '../../styles/status-page-styles/status-ping-styles.css'
import SysNotificationImg from "../../assets/system-notification.png"
import StatusPingImg from '../../assets/status-ping.png'

interface StatusPingComponentProps { }

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

const StatusPingComponent: FC<StatusPingComponentProps> = () => {
    const [termo, setTermo] = useState('');
    const [resultados, setResultados] = useState<SensorDTO[]>([]);
    const [sensorSelecionado, setSensorSelecionado] = useState<SensorDTO | null>(null);
    const [estadoPing, setEstadoPing] = useState<EstadoSensorDTO | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!termo.trim()) {
            setResultados([]);
            return;
        }

        debounceRef.current = setTimeout(() => {
            fetch(`/api/sensores/procurar?nome=${encodeURIComponent(termo)}`)
                .then(res => res.ok ? res.json() : Promise.reject(res))
                .then((data: SensorDTO[]) => setResultados(data))
                .catch(() => setResultados([]));
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [termo]);

    const escolherSensor = (sensor: SensorDTO) => {
        setSensorSelecionado(sensor);
        setResultados([]);
        setTermo('');
        setEstadoPing(null);
    };

    const testarConexao = () => {
        if (!sensorSelecionado) return;

        fetch(`/api/sensores/${sensorSelecionado.idSensor}/ping`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((data: EstadoSensorDTO) => setEstadoPing(data))
            .catch(() => setEstadoPing(null));
    };

    return (
        <>
            <div className="status-wrapper">
                <div className="status-header-row">
                    <div className="status-btn-box">
                        <img src={StatusPingImg} alt="Conexão" />
                        <p>Conexão</p>
                        <button onClick={testarConexao} disabled={!sensorSelecionado}>
                            Testar Conexão
                        </button>
                    </div>

                    <div className="status-search-wrapper">
                        <input
                            className="status-search-bar"
                            placeholder="Pesquisar por nome..."
                            value={termo}
                            onChange={(e) => setTermo(e.target.value)}
                        />
                    </div>
                </div>

                {resultados.length > 0 && (
                    <ul className="status-search-results">
                        {resultados.map((sensor) => (
                            <li
                                key={sensor.idSensor}
                                className="status-sensor-card"
                                onClick={() => escolherSensor(sensor)}
                            >
                                <span
                                    className={`status-sensor-bar ${sensor.estado === 'ATIVO' ? 'is-ativo' : 'is-inativo'}`}
                                />
                                <div className="status-sensor-content">
                                    <span className="status-sensor-nome">{sensor.nome}</span>
                                    <span className="status-sensor-tipo">{sensor.localizacao || 'Sem localização'}</span>
                                </div>
                                <span
                                    className={`status-sensor-dot ${sensor.estado === 'ATIVO' ? 'is-ativo' : 'is-inativo'}`}
                                />
                            </li>
                        ))}
                    </ul>
                )}

                <div className="status-ping-box">
                    <div>
                        <h1>Estado: {estadoPing ? (estadoPing.online ? 'Online' : 'Offline') : '—'}</h1>
                    </div>
                    <h2>{sensorSelecionado ? sensorSelecionado.nome : 'Nome do equipamento:'}</h2>
                    <div className="status-ping-messsage-box">
                        <img src={SysNotificationImg} alt="System Notification" />
                        <p>
                            {estadoPing
                                ? `Última leitura: ${estadoPing.ultimaLeitura ?? 'sem registo'}`
                                : 'Ultima leitura:'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StatusPingComponent;