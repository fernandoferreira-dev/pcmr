import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react"; // Fix para TS1484

export type Idioma = "pt" | "en";
export type Tema = "light" | "dark";

export interface AppContextType {
    tema: Tema;
    idioma: Idioma;
    alternarTema: () => void;
    mudarIdioma: (idioma: Idioma) => void;
    t: (chavePt: string, chaveEn: string) => string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [tema, setTema] = useState<Tema>(() => {
        const guardado = localStorage.getItem("app_tema") as Tema | null;
        if (guardado) return guardado;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    const [idioma, setIdioma] = useState<Idioma>(() => {
        const guardado = localStorage.getItem("app_idioma") as Idioma | null;
        return guardado ?? "pt";
    });

    useEffect(() => {
        const root = document.documentElement;
        if (tema === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("app_tema", tema);
    }, [tema]);

    useEffect(() => {
        localStorage.setItem("app_idioma", idioma);
    }, [idioma]);

    const alternarTema = () => setTema((prev) => (prev === "light" ? "dark" : "light"));
    const mudarIdioma = (novo: Idioma) => setIdioma(novo);
    const t = (chavePt: string, chaveEn: string) => (idioma === "pt" ? chavePt : chaveEn);

    return (
        <AppContext.Provider value={{ tema, idioma, alternarTema, mudarIdioma, t }}>
            {children}
        </AppContext.Provider>
    );
}

// Hook exportado no mesmo ficheiro
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp tem de ser usado dentro de um AppProvider");
    }
    return context;
}