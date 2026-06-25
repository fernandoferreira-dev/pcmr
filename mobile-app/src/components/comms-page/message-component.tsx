import UserImg from "../../assets/user-notification.png"
import "../../styles/messages-page-styles/message-box-styles.css"

export default function MessageComponent() {
    return (
        <>
            <div className="notification-wrapper">
                <div className="message-sender-div"> {/*name and date division*/}
                    <img src={UserImg} alt="Sender" className="message-icon"/>
                    <p>Nome</p> {/*should be bold*/}
                    <p>Data e hora</p>
                </div>
                <div className="message-sender-info"> {/*name and date division*/}
                    <p>Assunto</p>
                    <img src={UserImg} alt="Sender" className="message-state-icon"/>
                </div>
            </div>
            
        </>
    )
}