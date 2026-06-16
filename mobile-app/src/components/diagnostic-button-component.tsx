import type { FC } from 'react';
import btnImg from '../assets/diag.png';

interface DiagnosticButtonComponentProps {}

const DiagnosticButtonComponent: FC<DiagnosticButtonComponentProps> = () => (
  <div>
    <button className="diagnosticbtn" style={{ width: '40%', height: '50%'}}>
      <img src={btnImg} alt="Diagnostic Icon" style={{ width: '20%'}}/>
      Iniciar Diagnóstico
    </button>
    
  </div>
);

export default DiagnosticButtonComponent;
