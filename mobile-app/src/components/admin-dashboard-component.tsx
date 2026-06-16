import DiagnosticButtonComponent from '../components/diagnostic-button-component';
import '../styles/styles.css';


export default function AdminDashboardComponent() {
  return (
    <>
      <div>
        { /* Admin deverá ser o username do utilizadorasd */ }
        <h1>Bem vindo, Admin</h1>
        <DiagnosticButtonComponent/>
      </div>
    </>
  )
}