import DiagnosticButtonComponent from './diagnostic-button-component';
import '../styles/styles.css';


export default function AdminDashboardComponent() {
  return (
    <>
      <div className="main-page">
        { /* Admin deverá ser o username do utilizador */ }
        <h1>Bem vindo, Admin</h1>
        <div className="mainbox">  
          <DiagnosticButtonComponent/>
        </div>
      </div>
    </>
  )
}