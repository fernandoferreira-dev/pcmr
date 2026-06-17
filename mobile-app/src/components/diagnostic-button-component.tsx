import type { FC } from 'react';
import btnImg from '../assets/diag.png';

interface DiagnosticButtonComponentProps {}

const DiagnosticButtonComponent: FC<DiagnosticButtonComponentProps> = () => (
    <button className="diagnosticbtn">
      <img src={btnImg} alt="Diagnostic Icon" style={{ width: '20%'}}/>
      Iniciar Diagnóstico
    </button>
);

export default DiagnosticButtonComponent;