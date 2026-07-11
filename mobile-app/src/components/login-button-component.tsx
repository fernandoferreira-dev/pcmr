import '../styles/styles.css'

type Props = { onClick : () => void }

export default function LoginButtonComponent({ onClick }: Props) {
    return (
        <button className="btn" onClick={onClick}>
            Entrar
        </button>
    )
}