import { useEffect } from 'react';
import { useNotificationStore } from '../../context/notification-store';
import '../../styles/misc/notification-toast.css';

const AUTO_CLOSE_MS = 6000;

export default function NotificationToast() {
  const activeToast = useNotificationStore((state) => state.activeToast);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  useEffect(() => {
    if (!activeToast) return;
    // Warnings fecham sozinhos ao fim de 6s; críticos ficam até o médico fechar manualmente.
    if (activeToast.severidade === 'CRITICAL') return;

    const timer = setTimeout(() => dismissToast(), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const severidadeClasse =
    activeToast.severidade === 'CRITICAL'
      ? 'notification-toast--critical'
      : activeToast.severidade === 'WARNING'
      ? 'notification-toast--warning'
      : 'notification-toast--info';

  return (
    <div className={`notification-toast ${severidadeClasse}`} role="alert">
      <div className="notification-toast-content">
        <h2>{activeToast.titulo}</h2>
        <p>{activeToast.corpo}</p>
      </div>
      <button
        className="notification-toast-close"
        onClick={dismissToast}
        aria-label="Fechar notificação"
      >
        
      </button>
    </div>
  );
}