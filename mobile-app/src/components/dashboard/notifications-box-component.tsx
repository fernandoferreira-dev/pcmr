import type { FC } from 'react';
import { useNotificationStore } from '../../context/notification-store';
import '../../styles/dashboard-styles/notification-box.css';

interface NotificationBoxComponentProps {}

const formatarData = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const NotificationBoxComponent: FC<NotificationBoxComponentProps> = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const ultimas = notifications.slice(0, 10);

  return (
    <div className="notification-box">
      <h1>Ultimas notificações:</h1>

      {ultimas.length === 0 && (
        <div className="notification-box-text notification-box-text--empty">
          <h3>Sem notificações por agora.</h3>
        </div>
      )}

      {ultimas.map((n) => (
        <div key={n.id} className="notification-box-text">
          <h2>{n.titulo}</h2>
          <h3>{n.corpo}</h3>
          <span className="notification-box-text-meta">{formatarData(n.createdAt)}</span>
        </div>
      ))}
    </div>
  );
};

export default NotificationBoxComponent;