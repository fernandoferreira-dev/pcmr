import { useApp } from "../context/AppContext";

type Props = {
    onLogout: () => void;
};

export default function SettingsPage({ onLogout }: Props) {
    const { tema, idioma, alternarTema, mudarIdioma, t } = useApp();

    return (
        <div className="min-h-screen bg-background font-sans px-4 pt-4 pb-28 sm:max-w-md sm:mx-auto">
            {/* Cabeçalho */}
            <header className="mb-6">
                <h1 className="text-2xl font-extrabold tracking-tight text-text">
                    {t("Definições", "Settings")}
                </h1>
            </header>

            <div className="space-y-4">
                {/* Opção Tema */}
                <div className="bg-background rounded-2xl border border-primary-outline/40 p-4 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-sm text-text">
                            {t("Modo Escuro", "Dark Mode")}
                        </p>
                        <p className="text-xs text-muted">
                            {t("Alternar tema da aplicação", "Toggle application theme")}
                        </p>
                    </div>
                    <button
                        onClick={alternarTema}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                            tema === "dark" ? "bg-primary" : "bg-primary-outline/50"
                        }`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-background transition-transform ${
                                tema === "dark" ? "translate-x-6" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>

                {/* Opção Idioma */}
                <div className="bg-background rounded-2xl border border-primary-outline/40 p-4 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-sm text-text">
                            {t("Idioma", "Language")}
                        </p>
                        <p className="text-xs text-muted">
                            {t("Escolha o seu idioma", "Choose your language")}
                        </p>
                    </div>
                    <div className="flex bg-primary/10 p-1 rounded-xl border border-primary-outline/30">
                        <button
                            onClick={() => mudarIdioma("pt")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                idioma === "pt"
                                    ? "bg-background text-text shadow-xs"
                                    : "text-muted"
                            }`}
                        >
                            PT
                        </button>
                        <button
                            onClick={() => mudarIdioma("en")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                idioma === "en"
                                    ? "bg-background text-text shadow-xs"
                                    : "text-muted"
                            }`}
                        >
                            EN
                        </button>
                    </div>
                </div>

                {/* Botão de Logout */}
                <button
                    onClick={onLogout}
                    className="w-full mt-6 py-3.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-all active:scale-98 border border-red-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t("Sair da Conta", "Log Out")}</span>
                </button>
            </div>
        </div>
    );
}