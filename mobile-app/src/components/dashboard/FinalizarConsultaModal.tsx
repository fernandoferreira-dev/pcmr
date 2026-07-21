import { useState, useEffect, useRef, useCallback } from "react";
import "../../styles/dashboard-styles/finalizar-consulta-styles.css";

interface Pessoa {
  idPessoa: number;
  nome: string;
  email: string;
  cargo?: string;
}

type Modo = "procurar" | "novo";

export default function FinalizarConsultaModal({
  idMedico,
  deviceId,
  onClose,
  onFinalizado,
}: {
  idMedico: number;
  deviceId: string;
  onClose: () => void;
  onFinalizado: () => void;
}) {
  const [modo, setModo] = useState<Modo>("procurar");
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Pessoa[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Pessoa | null>(
    null,
  );
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [tokenGerado, setTokenGerado] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const procurarPacientes = useCallback(async (nome: string) => {
    try {
      const res = await fetch(
        `/api/pacientes/procurar?nome=${encodeURIComponent(nome)}`,
      );
      if (!res.ok) return;
      const data: Pessoa[] = await res.json();

      const apenasPacientes = data.filter(
        (p) => !p.cargo || p.cargo.toLowerCase() === "paciente"
      );

      setResultados(apenasPacientes);
    } catch { }
  }, []);

  useEffect(() => {
    if (modo !== "procurar") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      procurarPacientes(termo);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [termo, modo, procurarPacientes]);

  const podeConfirmar =
    modo === "procurar"
      ? pacienteSelecionado !== null
      : novoNome.trim() !== "" && novoEmail.trim() !== "";

  const confirmar = async () => {
    setAGuardar(true);
    setErro(null);

    const body =
      modo === "procurar"
        ? {
          idMedico,
          idPacienteExistente: pacienteSelecionado?.idPessoa,
          deviceId,
          observacoes,
        }
        : {
          idMedico,
          novoPaciente: {
            nome: novoNome,
            email: novoEmail,
          },
          deviceId,
          observacoes,
        };

    try {
      const res = await fetch("/api/consultas/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.sucesso) {
        if (data.tokenAcesso) {
          setTokenGerado(data.tokenAcesso);
        } else {
          onFinalizado();
        }
      } else {
        setErro(data.erro || "Erro ao finalizar a consulta.");
      }
    } catch {
      setErro("Erro de comunicação com o servidor.");
    } finally {
      setAGuardar(false);
    }
  };

  if (tokenGerado) {
    return (
      <div className="fcm-overlay">
        <div className="fcm-sucesso-card">
          <h2 className="fcm-sucesso-titulo">
            Consulta Finalizada!
          </h2>
          <p className="fcm-sucesso-subtitulo">
            O novo paciente foi registado com sucesso.
          </p>

          <div className="fcm-token-box">
            <p className="fcm-token-label">
              Código de Acesso
            </p>
            <p className="fcm-token-valor">
              {tokenGerado}
            </p>
            <p className="fcm-token-nota">
              Forneça este código ao paciente para que este consiga aceder à aplicação móvel.
            </p>
          </div>

          <button
            onClick={onFinalizado}
            className="fcm-btn-concluir"
          >
            Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fcm-overlay">
      <div className="fcm-card">
        <button
          onClick={onClose}
          className="fcm-close-btn"
          title="Fechar"
        >
          ✕
        </button>

        <h2 className="fcm-titulo">
          Associar Paciente
        </h2>

        <div className="fcm-tabs">
          <button
            onClick={() => setModo("procurar")}
            className={`fcm-tab ${modo === "procurar" ? "fcm-tab-ativa" : ""}`}
          >
            Paciente existente
          </button>
          <button
            onClick={() => setModo("novo")}
            className={`fcm-tab ${modo === "novo" ? "fcm-tab-ativa" : ""}`}
          >
            Novo paciente
          </button>
        </div>

        {modo === "procurar" ? (
          <div className="fcm-form-col">
            <input
              type="text"
              placeholder="Procurar por nome..."
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value);
                setPacienteSelecionado(null);
              }}
              className="fcm-input"
            />

            <div className="fcm-resultados-lista">
              {resultados.map((p) => (
                <button
                  key={p.idPessoa}
                  onClick={() => setPacienteSelecionado(p)}
                  className={`fcm-resultado-item ${
                    pacienteSelecionado?.idPessoa === p.idPessoa
                      ? "fcm-resultado-item-selecionado"
                      : ""
                  }`}
                >
                  <div className="fcm-resultado-nome">{p.nome}</div>
                  <div className="fcm-resultado-email">{p.email}</div>
                </button>
              ))}
              {resultados.length === 0 && termo.trim() !== "" && (
                <p className="fcm-resultado-vazio">
                  Nenhum paciente encontrado.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="fcm-form-col">
            <input
              type="text"
              placeholder="Nome do paciente"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="fcm-input"
            />
            <input
              type="email"
              placeholder="Email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              className="fcm-input"
            />
          </div>
        )}

        <textarea
          placeholder="Observações (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="fcm-textarea"
          rows={3}
        />

        {erro && <p className="fcm-erro">{erro}</p>}

        <button
          disabled={!podeConfirmar || aGuardar}
          onClick={confirmar}
          className="fcm-btn-confirmar"
        >
          {aGuardar ? "A guardar..." : "Guardar Consulta"}
        </button>
      </div>
    </div>
  );
}