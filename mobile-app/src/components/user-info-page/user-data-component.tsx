import '../../styles/user-info-styles/user-data-styles.css'

type Props = { username: string; phonenumber: string; email: string };

export default function UserDataComponent({ username, phonenumber, email}: Props) {
    return (
        <>
            <div className="user-info-main-box">
                <div>
                    <div className="user-data-icon"> 
                        <img className="icon"/>
                    </div>
                    <div className="user-data-box">
                        <h2>Nome de utilizador</h2>
                        <p>{username}</p>
                    </div>
                </div>
                <div>
                    <div className="user-data-icon">
                        <img className="icon"/>
                    </div>
                    <div className="user-data-box">
                        <h2>Número de Telemóvel</h2>
                        <p>{phonenumber}</p>
                    </div>
                </div>
                <div>
                    <div className="user-data-icon">
                        <img className="icon"/>
                    </div>
                    <div className="user-data-box">
                        <h2>Email:</h2>
                        <p>{email}</p>
                    </div>
                </div>
            </div>
        </>
    )
}
