import '../../styles/user-info-styles/user-data-styles.css'

export default function UserDataComponent() {
    return (
        <>
            <div className="user-info-main-box">
                <div>
                    <div className="user-data-icon"> 
                        <img className="icon"/>
                    </div>
                    <div className="user-data-box">
                        <h2>Nome de utilizador</h2>
                        <p>Nome</p>
                    </div>
                </div>
                <div>
                    <div className="user-data-icon">
                        <img className="icon"/>
                    </div>
                    <div className="user-data-box">
                        <h2>Número de Telemóvel</h2>
                        <p>Número</p>
                    </div>
                </div>
                <div>
                    <div className="user-data-icon">
                        <img className="icon"/>
                    </div>
                    <div className="user-data-box">
                        <h2>Email</h2>
                        <p>Email@email.com</p>
                    </div>
                </div>
            </div>
        </>
    )
}
