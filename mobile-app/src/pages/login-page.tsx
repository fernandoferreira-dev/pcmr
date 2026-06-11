import '../styles/styles.css'
import LoginButtonComponent from '../components/login-button-component'
import FooterComponent from '../components/footer-component'
import appImage from '../assets/place-holder.png'
import RegisterButtonComponent from '../components/register-button-component'

export default function LoginPage() {
    return (
        <div>
            <div>
                <img src={appImage} alt="Illustrative image" style={{ width: '25%', height: 'auto' }} />
            </div>
            <h1>Medycist</h1>
            <form className="login-page">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" type="text" />

                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" />

                <div className="button-row">
                    <LoginButtonComponent/>
                    <RegisterButtonComponent/>
                </div>
            </form>
            <FooterComponent/>
        </div>
    )
}
