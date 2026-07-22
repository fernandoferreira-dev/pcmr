import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import '../../styles/status-page-styles/status-ping-styles.css';
import SysNotificationImg from "../../assets/system-notification.png";
import StatusPingImg from '../../assets/status-ping.png';
import { useTranslation } from "react-i18next";

interface StatusPingComponentProps { }

interface SensorDTO {
    idSensor: number;
    nome: string;
    nomeExibicao?: string | null;
    localizacao: string | null;
    tipo?: string;
    estado: string;
}

interface EstadoSensorDTO {
    online: boolean;
    ultimaLeitura: string | null;
    segundosDesdeUltimaLeitura: number;
}

const StatusPingComponent: FC<StatusPingComponentProps> = () => {
    const [termo, setTermo] = useState('');
    const [sensores, setSensores] = useState<SensorDTO[]>([]);
    const [sensorSelecionado, setSensorSelecionado] = useState<SensorDTO | null>(null);
    const [estadoPing, setEstadoPing] = useState<EstadoSensorDTO | null>(null);
    const [carregando, setCarregando] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { t } = useTranslation();

    // Carrega todos os sensores (mesma forma que DadosEquipamentos)
    const carregarSensores = async () => {
        try {
            setCarregando(true);
            const res = await fetch("/api/sensores");
            if (!res.ok) return;
            const data: SensorDTO[] = await res.json();
            setSensores(data);
        } catch (err) {
            console.error("Erro ao carregar sensores:", err);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarSensores();
    }, []);

    // Filtragem client-side (igual ao DadosEquipamentos)
    const resultados = useMemo(() => {
        if (!termo.trim()) return [];

        const termoLower = termo.toLowerCase();
        return sensores.filter((sensor) => {
            const nomeMostrado = sensor.nomeExibicao || sensor.nome;
            return nomeMostrado.toLowerCase().includes(termoLower);
        });
    }, [termo, sensores]);

    const escolherSensor = (sensor: SensorDTO) => {
        setSensorSelecionado(sensor);
        setTermo('');
        setEstadoPing(null);
    };

    const testarConexao = async () => {
        if (!sensorSelecionado) return;

        // Usa o "nome" como deviceId, igual ao DadosEquipamentos.tsx
        try {
            const deviceId = sensorSelecionado.nome;
            const res = await fetch(`/api/sensores/${deviceId}/ping`);

            if (!res.ok) {
                setEstadoPing(null);
                return;
            }

            const data: EstadoSensorDTO = await res.json();
            setEstadoPing(data);
        } catch (err) {
            console.error("Erro no ping:", err);
            setEstadoPing(null);
        }
    };

    return (
        <>
            <div className="status-wrapper">
                <div className="status-header-row">
                    <div className="status-btn-box">
                        <img src={StatusPingImg} alt="Conexão" />
                        <p>{t('equipment.connection')}</p>
                        <button
                            onClick={testarConexao}
                            disabled={!sensorSelecionado || carregando}
                        >
                            {t('equipment.testConnectionButton')}
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

                {/* Lista de resultados da pesquisa */}
                {resultados.length > 0 && (
                    <ul className="status-search-results">
                        {resultados.map((sensor) => {
                            const nomeMostrado = sensor.nomeExibicao || sensor.nome;
                            return (
                                <li
                                    key={sensor.idSensor}
                                    className="status-sensor-card"
                                    onClick={() => escolherSensor(sensor)}
                                >
                                    <span
                                        className={`status-sensor-bar ${sensor.estado === 'ATIVO' ? 'is-ativo' : 'is-inativo'}`}
                                    />
                                    <div className="status-sensor-content">
                                        <span className="status-sensor-nome">{nomeMostrado}</span>
                                        <span className="status-sensor-tipo">
                                            {sensor.localizacao || 'Sem localização'}
                                        </span>
                                    </div>
                                    <span
                                        className={`status-sensor-dot ${sensor.estado === 'ATIVO' ? 'is-ativo' : 'is-inativo'}`}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="status-ping-box">
                    <div>
                        <h1>
                            {t('equipment.status', {
                                value: estadoPing ? (estadoPing.online ? 'Online' : 'Offline') : '—',
                            })}
                        </h1>
                    </div>
                    <h2>
                        {sensorSelecionado
                            ? (sensorSelecionado.nomeExibicao || sensorSelecionado.nome)
                            : 'Nome do equipamento:'}
                    </h2>
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