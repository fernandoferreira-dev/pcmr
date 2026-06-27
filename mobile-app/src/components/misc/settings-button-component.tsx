import SettingsIcon from "../../assets/settings-icon.png"

export default function SettingsButtonComponent() {
    return(
        <>
            <button>
                <div className="settings-container">
                    <img className="settings-icon" src={SettingsIcon} alt="Settings"></img>
                </div>
            </button>
        </>
    )
}