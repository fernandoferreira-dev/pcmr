import MessageComponent from "../components/comms-page/message-component"
import "../styles/messages-page-styles/message-box-styles.css"
import '../i18nConfig';

export default function ContactPage() {
    return (
        <>
            <div className="message-wrapper">
                <MessageComponent />
            </div>
        </>
    )
}
