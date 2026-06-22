import type { FC } from 'react';
import '../../styles/status-page-styles/status-ping-styles.css'
import SysNotificationImg from "../../assets/system-notification.png"
import UserNotificationImg from "../../assets/user-notification.png"

interface StatusPingComponentProps {}

const StatusPingComponent: FC<StatusPingComponentProps> = () => (
    <>
        <div className="status-ping-box">
            <div>
                <h1>Estado: </h1>   
            </div>
            <h2>Nome do equipamento place holder</h2>
            <div className="status-ping-messsage-box">
                <img src={SysNotificationImg} alt="System Notification"/>
                <p>Corpo da notificação place holder</p>
            </div> 
        </div>
    </>
);
  
export default StatusPingComponent;  
