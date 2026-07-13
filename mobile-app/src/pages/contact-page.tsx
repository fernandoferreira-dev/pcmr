import MessageComponent from "../components/comms-page/message-component"
import "../styles/messages-page-styles/message-box-styles.css"

export default function ContactPage() {
    return (
        <>
            <div className="message-wrapper">
                <h1>Mensagens recentes</h1>
                <MessageComponent />
            </div>
        </>
    )
}
