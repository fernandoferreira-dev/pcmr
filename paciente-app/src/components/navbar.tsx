import "../assets/styles/index.css";

export type PacienteView = "diagnosticos" | "mensagens";

type NavBarProps = {
    active: PacienteView;
    onNavigate: (view: PacienteView) => void;
};

function NavBar({ active, onNavigate }: NavBarProps) {
    const items: { id: PacienteView; label: string; icon: React.ReactNode }[] = [
        {
            id: "diagnosticos",
            label: "Diagnósticos",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="9" y1="7" x2="15" y2="7" />
                    <line x1="9" y1="11" x2="15" y2="11" />
                    <line x1="9" y1="15" x2="13" y2="15" />
                </svg>
            ),
        },
        {
            id: "mensagens",
            label: "Mensagens",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.8 11.6 19.79 19.79 0 0 1 1.72 3 2 2 0 0 1 3.7 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.7a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 15.92z" />
                </svg>
            ),
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-primary-outline flex justify-around items-center py-2 font-sans">
            {items.map((item) => {
                const isActive = active === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex flex-col items-center gap-1 px-6 py-1 rounded-xl transition-colors cursor-pointer ${
                            isActive ? "text-primary font-semibold" : "text-muted"
                        }`}
                    >
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

export default NavBar;