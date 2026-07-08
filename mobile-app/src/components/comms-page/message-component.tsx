import UserImg from "../../assets/user-notification.png";
import { FaRegTrashAlt } from "react-icons/fa";
import "../../styles/messages-page-styles/message-box-styles.css";

export default function MessageComponent() {
    return (
        <div className="notification-wrapper">
            <div className="message-header">
                <div className="sender-info">
                    <img src={UserImg} alt="Sender" className="message-icon"/>
                    <span className="sender-name">
                        Admin de Testes
                    </span>
                </div>
                <span className="message-date">
                    08/07/26, 14:10
                </span>
            </div>
            <div className="message-body">
                <span className="message-subject">
                    <strong>Assunto:</strong> efw
                </span>
                <div className="message-actions">
                    <FaRegTrashAlt className="trash-icon" />
                    <div className="unread-dot"></div>
                </div>
            </div>
        </div>
    );
}