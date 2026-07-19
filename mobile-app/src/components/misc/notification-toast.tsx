import { useEffect } from 'react';
import { useNotificationStore } from '../../context/notification-store';
import '../../styles/misc/notification-toast.css';

const AUTO_CLOSE_MS = 8000;

export default function NotificationToast() {
  const activeToast = useNotificationStore((state) => state.activeToast);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => dismissToast(), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div className="notification-toast notification-toast--warning" role="alert">
      <div className="notification-toast-content">
        <h2>{activeToast.titulo}</h2>
        <p>{activeToast.corpo}</p>
      </div>
      <button
        className="notification-toast-close"
        onClick={dismissToast}
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  );
}