import { useState, useEffect, useRef, useCallback } from "react";

interface Pessoa {
  idPessoa: number;
  nome: string;
  email: string;
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const procurarPacientes = useCallback(async (nome: string) => {
    try {
      const res = await fetch(
        `/api/pacientes/procurar?nome=${encodeURIComponent(nome)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setResultados(data);
    } catch {}
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
        onFinalizado();
      } else {
        setErro(data.erro || "Erro ao finalizar a consulta.");
      }
    } catch {
      setErro("Erro de comunicação com o servidor.");
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl cursor-pointer"
          title="Fechar"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Associar Paciente
        </h2>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModo("procurar")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              modo === "procurar"
                ? "bg-[#AAB99F] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Paciente existente
          </button>
          <button
            onClick={() => setModo("novo")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              modo === "novo"
                ? "bg-[#AAB99F] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Novo paciente
          </button>
        </div>

        {modo === "procurar" ? (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Procurar por nome..."
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value);
                setPacienteSelecionado(null);
              }}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
            />

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
              {resultados.map((p) => (
                <button
                  key={p.idPessoa}
                  onClick={() => setPacienteSelecionado(p)}
                  className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    pacienteSelecionado?.idPessoa === p.idPessoa
                      ? "bg-[#AAB99F] text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="font-medium">{p.nome}</div>
                  <div className="text-xs opacity-80">{p.email}</div>
                </button>
              ))}
              {resultados.length === 0 && termo.trim() !== "" && (
                <p className="text-xs text-gray-400 px-1">
                  Nenhum paciente encontrado.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nome do paciente"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        )}

        <textarea
          placeholder="Observações (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm mt-3 w-full resize-none"
          rows={3}
        />

        {erro && <p className="text-sm text-red-600 mt-3">{erro}</p>}

        <button
          disabled={!podeConfirmar || aGuardar}
          onClick={confirmar}
          className="w-full mt-4 py-2 bg-[#AAB99F] hover:bg-[#9CB39E] disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-white font-medium transition-colors shadow-sm"
        >
          {aGuardar ? "A guardar..." : "Guardar Consulta"}
        </button>
      </div>
    </div>
  );
}
