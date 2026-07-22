import { useApp } from "../context/AppContext";

export type TabNavegacao = "mensagens" | "diagnosticos" | "definicoes";

type Props = {
    abaAtiva: TabNavegacao;
    aoMudarAba: (aba: TabNavegacao) => void;
};

export function Navbar({ abaAtiva, aoMudarAba }: Props) {
    const { t } = useApp();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background text-text border-t border-primary-outline/30 px-6 py-2 shadow-lg z-20">
            <div className="max-w-md mx-auto flex justify-between items-center">
                {/* 1. Mensagens */}
                <button
                    onClick={() => aoMudarAba("mensagens")}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer ${
                        abaAtiva === "mensagens"
                            ? "text-primary scale-105 font-bold"
                            : "text-muted hover:text-text"
                    }`}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={abaAtiva === "mensagens" ? "2.5" : "2"}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <span className="text-xs">{t("Mensagens", "Messages")}</span>
                </button>

                {/* 2. Início / Diagnósticos */}
                <button
                    onClick={() => aoMudarAba("diagnosticos")}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer ${
                        abaAtiva === "diagnosticos"
                            ? "text-primary scale-105 font-bold"
                            : "text-muted hover:text-text"
                    }`}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={abaAtiva === "diagnosticos" ? "2.5" : "2"}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                    <span className="text-xs">{t("Início", "Start")}</span>
                </button>

                {/* 3. Definições */}
                <button
                    onClick={() => aoMudarAba("definicoes")}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer ${
                        abaAtiva === "definicoes"
                            ? "text-primary scale-105 font-bold"
                            : "text-muted hover:text-text"
                    }`}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={abaAtiva === "definicoes" ? "2.5" : "2"}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <span className="text-xs">{t("Definições", "Settings")}</span>
                </button>
            </div>
        </nav>
    );
}