import type { FC } from 'react';
import '../../styles/dashboard-styles/notification-box.css'


interface NotificationBoxComponentProps {}

const NotificationBoxComponent: FC<NotificationBoxComponentProps> = () => (
  <div className="notification-box">
    <h1> Ultimas notificações: </h1>
    <div>
      <h2>Nome do utilizador place holder</h2>
      <h3>Corpo da notificação place holder</h3>
    </div>
  </div>
);

export default NotificationBoxComponent;  
