import DiagnosticButtonComponent from './diagnostic-button-component';
import '../../styles/dashboard-styles/dashboard-styles.css';

export default function AdminDashboardComponent() {
  return (
    <>
      <div className="main-page">
        { /* Admin deverá ser o username do utilizador */ }
        <h1>Bem vindo, Admin</h1>
        <div className="mainbox">  
          <DiagnosticButtonComponent/>
          <div className="main-pages-states">
            <div className="main-page-states-box">
              <h2>Estado do servidor: </h2>
              <div className="OKstate"></div>
            </div>
            <div className="main-page-states-box">
              <h2>Estado do sensor nó: </h2>
              <div className="OKstate"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}