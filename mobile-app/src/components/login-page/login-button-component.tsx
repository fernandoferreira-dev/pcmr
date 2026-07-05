import '../../styles/login-page/login-page-styles.css'

type Props = { onClick : () => void; disabled?: boolean; label?: string }

export default function LoginButtonComponent({ onClick, disabled = false, label = "Login" }: Props) {
    return (
        <button type="button" className="btn" onClick={onClick} disabled={disabled}>
            {label}
        </button>
    )
}