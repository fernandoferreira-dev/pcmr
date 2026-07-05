import { useState } from 'react'
import '../styles/login-page/login-page-styles.css'
import LoginButtonComponent from '../components/login-page/login-button-component'
import FooterComponent from '../components/misc/footer-component'
import appImage from '../assets/place-holder.png'
import RegisterButtonComponent from '../components/login-page/register-button-component'
import CreateAccountComponent from '../components/login-page/create-account-btn-component'

type Props = { onLogin: () => void }

export default function LoginPage({ onLogin }: Props) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLogin = async () => {
        setErrorMessage('')

        if (!username.trim() || !password.trim()) {
            setErrorMessage('Please enter your username and password.')
            return
        }

        setIsSubmitting(true)

        try {
            const params = new URLSearchParams({ username, password })
            const response = await fetch(`http://localhost:8080/api/auth/login?${params.toString()}`, {
                method: 'GET',
            })

            const responseText = await response.text()

            if (!response.ok) {
                throw new Error(responseText || 'Parametros inválidos')
            }

            onLogin()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Login Falhou')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div>
            <h1 style={{ color: '#4E5452' }}>Medycist</h1>
            <div>
                <img src={appImage} alt="Illustrative image" style={{ width: '25%', height: 'auto' }} />
            </div>
            <div className="login-page">
                <label htmlFor="username" style={{ marginTop: '1rem' }}>Username</label>
                <input className="input" id="username" name="username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} />

                <label htmlFor="password">Password</label>
                <input className="input" id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

                <div className="button-row">
                    <LoginButtonComponent onClick={handleLogin} disabled={isSubmitting} label={isSubmitting ? 'A Entrar...' : 'Login'} />
                    <CreateAccountComponent/>
                    <RegisterButtonComponent/>
                </div>

                {errorMessage && (
                    <p className="error-message" role="alert">{errorMessage}</p>
                )}
            </div>
            <FooterComponent/>
        </div>
    )
}
