import MessageComponent from "../components/comms-page/message-component"
import "../styles/messages-page-styles/message-box-styles.css"

export default function ContactPage() {
    return (
        <>
            
            <h1>Contactos</h1>
            <div className="message-wrapper">
                <MessageComponent/>
            </div>
        </>
    )
}
