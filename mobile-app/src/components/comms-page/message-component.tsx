import UserImg from "../../assets/user-notification.png"
import "../../styles/messages-page-styles/message-box-styles.css"

export default function MessageComponent() {
    return (
        <>
            <div className="message-wrapper"> {/*the wrapper of the notification*/}
                <div className="message-sender-div"> {/*name and date division*/}
                    <img src={UserImg} alt="Sender" className="message-icon"/>
                    <p>Nome</p> {/*should be bold*/}
                    <p>Data e hora</p>
                </div>
                <div className="message-sender-div"> {/*message content and state division*/}
                    <p>Message body</p>
                    <img src={UserImg} alt="Message type"></img> {/*this is supposed to be a circle*/}
                </div>
            </div>
        </>
    )
}