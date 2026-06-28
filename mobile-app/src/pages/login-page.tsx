import '../styles/login-page/login-page-styles.css'
import LoginButtonComponent from '../components/login-page/login-button-component'
import FooterComponent from '../components/misc/footer-component'
import appImage from '../assets/place-holder.png'
import RegisterButtonComponent from '../components/login-page/register-button-component'

type Props = { onLogin: () => void }

export default function LoginPage({ onLogin }: Props) {
    return (
        <div>
            <h1 style={{ color: '#4E5452' }}>Medycist</h1>
            <div>
                <img src={appImage} alt="Illustrative image" style={{ width: '25%', height: 'auto' }} />
            </div>
            <form className="login-page">
                <label htmlFor="username" style={{ marginTop: '1rem' }}>Username</label>
                <input className="input" id="username" name="username" type="text" />

                <label htmlFor="password">Password</label>
                <input className="input" id="password" name="password" type="password" />

                <div className="button-row">
                    <LoginButtonComponent onClick={onLogin} />
                    <RegisterButtonComponent/>
                </div>
            </form>
            <FooterComponent/>
        </div>
    )
}
