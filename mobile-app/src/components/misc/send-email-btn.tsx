import { useState, useEffect, useRef, useCallback } from "react";
import "../../styles/misc/settings-btn-styles.css"
import SendIcon from "../../assets/send-icon.png"
import EmailIcon from "../../assets/email-icon.png"

const API_URL = "http://localhost:8080";

interface UtilizadorResumo {
  idUtilizador: number;
  nome: string;
}

interface NovaMensagemDTO {
  idRemetente: number;
  idDestinatario: number;
  assunto: string;
  corpo: string;
}

export default function SendEmailButtonComponent({ idRemetente }: { idRemetente: number | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<UtilizadorResumo[]>([]);
  const [destinatario, setDestinatario] = useState<UtilizadorResumo | null>(null);

  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");

  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const procurar = useCallback(async (nome: string) => {
    if (!nome.trim()) {
      setResultados([]);
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/mensagens/utilizadores/procurar?nome=${encodeURIComponent(nome)}&excluirId=${idRemetente}`
      );
      if (!res.ok) return;
      const data: UtilizadorResumo[] = await res.json();
      setResultados(data);
    } catch {
      // se nao encontrar um user nao mostra nada inves de interromper o utilizador 
    }
  }, [idRemetente]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => procurar(termo), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [termo, procurar]);

  const podeEnviar = destinatario !== null && assunto.trim() !== "";

  const resetForm = () => {
    setTermo("");
    setResultados([]);
    setDestinatario(null);
    setAssunto("");
    setCorpo("");
    setErro(null);
  };

  const handleSendEmail = async () => {
    if (!podeEnviar || idRemetente === null) return;

    setAEnviar(true);
    setErro(null);

    const emailData: NovaMensagemDTO = {
      idRemetente,
      idDestinatario: destinatario!.idUtilizador,
      assunto,
      corpo,
    };

    try {
      const res = await fetch(`${API_URL}/api/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        resetForm();
        setIsOpen(false);
      } else {
        setErro(data?.erro ?? "Erro ao enviar a mensagem.");
      }
    } catch {
      setErro("Erro de comunicação com o servidor.");
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <>
      <div className="settings-container">
        <button onClick={() => setIsOpen(true)} className="settings-container-button">
          <img className="settings-icon" src={EmailIcon} alt="Email" />
        </button>

        {isOpen && (
          <div className="overlay">
            <div className="modal">
              <p>| Enviar Email |</p>
              <div className="settings">

                <div className="option-container">
                  <label>Destinatário:
                    <input
                      type="text"
                      className="message-receiver"
                      placeholder="Procurar por nome..."
                      value={destinatario ? destinatario.nome : termo}
                      onChange={(e) => {
                        setDestinatario(null);
                        setTermo(e.target.value);
                      }}
                    />
                  </label>
                  {!destinatario && resultados.length > 0 && (
                    <ul className="search-results">
                      {resultados.map((u) => (
                        <li
                          key={u.idUtilizador}
                          onClick={() => {
                            setDestinatario(u);
                            setResultados([]);
                          }}
                        >
                          {u.nome}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="option-container">
                  <label>Assunto:
                    <input
                      type="text"
                      className="message-subject"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                    />
                  </label>
                </div>

                <div className="option-container">
                  <label>Corpo da mensagem:
                    <textarea
                      className="message-body"
                      value={corpo}
                      onChange={(e) => setCorpo(e.target.value)}
                    />
                  </label>
                </div>

                {erro && <p className="error-message">{erro}</p>}

                <div className="settings-container">
                  <button
                    onClick={handleSendEmail}
                    disabled={!podeEnviar || aEnviar}
                    className="settings-container-button"
                  >
                    <img src={SendIcon} alt="Enviar Email" className="settings-icon" />
                  </button>
                </div>
              </div>

              <button onClick={() => { setIsOpen(false); resetForm(); }}>Fechar</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}