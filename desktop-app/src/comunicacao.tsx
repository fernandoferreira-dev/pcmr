import { useState, useEffect } from "react";

interface PerfilUtilizador {
  username: string;
  nome: string;
  email: string;
  telemovel: string | null;
  dataNascimento: string | null;
  tipoUtilizador: string;
}

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0">
    <div className="w-12 h-12 rounded-full bg-[#AAB99F] flex items-center justify-center shrink-0 shadow-sm text-white">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </span>
      <span className="text-lg font-semibold text-gray-800">{value}</span>
    </div>
  </div>
);

// Novo componente para renderizar os campos em modo de edição
const EditRow = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  icon,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0">
    <div className="w-12 h-12 rounded-full bg-[#AAB99F] flex items-center justify-center shrink-0 shadow-sm text-white">
      {icon}
    </div>
    <div className="flex flex-col w-full">
      <label
        htmlFor={name}
        className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full text-lg font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#AAB99F]"
      />
    </div>
  </div>
);

function formatarData(dataISO: string | null): string {
  if (!dataISO) return "Não definida";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-PT");
}

// Helper para converter data para o input type="date"
function paraDataInput(dataISO: string | null): string {
  if (!dataISO) return "";
  return dataISO.split("T")[0];
}

export default function DadosPessoais({ userId }: { userId: number }) {
  const [perfil, setPerfil] = useState<PerfilUtilizador | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Novos estados para a edição
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PerfilUtilizador>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const res = await fetch(`/api/utilizadores/${userId}/perfil`);
        if (!res.ok) {
          setErro("Não foi possível carregar os dados pessoais.");
          return;
        }
        const data: PerfilUtilizador = await res.json();
        setPerfil(data);
        setErro(null);
      } catch {
        setErro("Erro de comunicação com o servidor.");
      }
    };

    if (userId > 0) {
      carregarPerfil();
    } else {
      setErro("Utilizador de teste sem perfil associado.");
    }
  }, [userId]);

  // Modo de edição
  const handleEdit = () => {
    setFormData(perfil || {});
    setIsEditing(true);
    setErro(null);
  };

  // Cancelar a edição
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
    setErro(null);
  };

  // Atualizar o estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === "" && name !== "username" && name !== "email" ? null : value,
    }));
  };

  // Gravar os dados na Base de Dados
  const handleSave = async () => {
    setIsSaving(true);
    setErro(null);

    try {
      const res = await fetch(`/api/utilizadores/${userId}/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Falha ao gravar as alterações.");
      }

      // Atualiza o estado principal com os novos dados recebidos do servidor
      const dataAtualizada: PerfilUtilizador = await res.json();
      setPerfil(dataAtualizada);
      setIsEditing(false);
    } catch (err) {
      setErro("Erro ao gravar os dados. Tenta novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 bg-[#EBEBEB] rounded-4xl shadow-inner overflow-y-auto">
      {erro && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-2xl px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Cartão principal - Informações de contacto */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-300 shadow-sm p-6">
          <div className="text-sm font-bold text-gray-600 mb-2 tracking-wide uppercase flex justify-between items-center">
            Informações de Contacto
            {isEditing && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Modo de Edição
              </span>
            )}
          </div>

          {!isEditing ? (
            <>
              <InfoRow
                label="Nome de utilizador"
                value={perfil?.username ?? "—"}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
              />
              <InfoRow
                label="Número de Telemóvel"
                value={perfil?.telemovel ?? "Não definido"}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              />
              <InfoRow
                label="Email"
                value={perfil?.email ?? "—"}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                }
              />
            </>
          ) : (
            // Formatos Editáveis
            <>
              <EditRow
                label="Nome de utilizador"
                name="username"
                value={formData.username ?? ""}
                onChange={handleChange}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
              />
              <EditRow
                label="Número de Telemóvel"
                name="telemovel"
                type="tel"
                value={formData.telemovel ?? ""}
                onChange={handleChange}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              />
              <EditRow
                label="Email"
                name="email"
                type="email"
                value={formData.email ?? ""}
                onChange={handleChange}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* Cartão lateral - Resumo da conta */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 flex flex-col gap-4">
            <div className="text-sm font-bold text-gray-600 tracking-wide uppercase">
              Resumo da conta
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Estado</span>
              <span className="px-3 py-1 rounded-full bg-[#AAB99F]/30 text-[#5c6b56] text-sm font-semibold">
                {perfil?.tipoUtilizador ?? "—"}
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <span className="text-sm text-gray-500 font-medium">
                Data de Nascimento
              </span>

              {!isEditing ? (
                <span className="text-sm font-semibold text-gray-800">
                  {formatarData(perfil?.dataNascimento ?? null)}
                </span>
              ) : (
                <input
                  type="date"
                  name="dataNascimento"
                  value={paraDataInput(formData.dataNascimento ?? null)}
                  onChange={handleChange}
                  className="w-full text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AAB99F]"
                />
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="w-full py-3 bg-[#AAB99F] hover:bg-[#9CB39E] transition-colors rounded-xl text-white font-medium shadow-sm"
            >
              Editar Dados
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-[#AAB99F] hover:bg-[#9CB39E] transition-colors rounded-xl text-white font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSaving ? "A guardar..." : "Guardar Alterações"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-300 transition-colors rounded-xl text-gray-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
