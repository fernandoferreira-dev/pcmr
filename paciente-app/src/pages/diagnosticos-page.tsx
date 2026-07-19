import "../assets/styles/index.css";

type Diagnostico = {
    id: number;
    date: string;
    status: string;
    temperatura: number;
    bpm: number;
    magnitudeG: number;
};

type Props = {
    diagnostico: Diagnostico;
    onClose: () => void;
};

function DiagnosticoDetalheModal({ diagnostico, onClose }: Props) {
    const formatarData = (iso: string) =>
        new Date(iso).toLocaleString("pt-PT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-background rounded-3xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative font-sans border-t-8 border-primary">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-text text-xl cursor-pointer"
                    title="Fechar"
                >
                    ✕
                </button>

                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Diagnóstico #{diagnostico.id}
        </span>
                <h2 className="text-xl font-bold text-text mt-1 mb-1">
                    {formatarData(diagnostico.date)}
                </h2>

                <div className="grid grid-cols-3 gap-3 my-5">
                    <div className="flex flex-col items-center bg-primary/5 rounded-2xl py-4">
                        <span className="text-2xl">🌡️</span>
                        <span className="text-lg font-bold text-text mt-1">
              {diagnostico.temperatura?.toFixed?.(1) ?? diagnostico.temperatura} °C
            </span>
                        <span className="text-[0.65rem] text-muted uppercase tracking-wide mt-0.5">
              Temperatura
            </span>
                    </div>
                    <div className="flex flex-col items-center bg-primary/5 rounded-2xl py-4">
                        <span className="text-2xl">❤️</span>
                        <span className="text-lg font-bold text-text mt-1">{diagnostico.bpm} bpm</span>
                        <span className="text-[0.65rem] text-muted uppercase tracking-wide mt-0.5">
              Cardíaco
            </span>
                    </div>
                    <div className="flex flex-col items-center bg-primary/5 rounded-2xl py-4">
                        <span className="text-2xl">📈</span>
                        <span className="text-lg font-bold text-text mt-1">
              {diagnostico.magnitudeG?.toFixed?.(2) ?? diagnostico.magnitudeG} G
            </span>
                        <span className="text-[0.65rem] text-muted uppercase tracking-wide mt-0.5">
              Magnitude
            </span>
                    </div>
                </div>

                <div className="border-t border-primary-outline pt-4">
                    <h3 className="text-sm font-semibold text-text mb-2">Observações do médico</h3>
                    <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                        {diagnostico.status?.trim() ? diagnostico.status : "Sem observações registadas."}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-primary text-background font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
}

export default DiagnosticoDetalheModal;