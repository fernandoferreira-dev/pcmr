import { useEffect, useState } from "react";
import "../assets/styles/index.css";

type Diagnostico = {
    id: number;
    date: string;
    status: string;
    temperatura: number;
    bpm: number;
    magnitudeG: number;
};

function DiagnosticosPage({ idPessoa }: { idPessoa: number }) {
    const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        const carregar = async () => {
            try {
                const res = await fetch(`/api/diagnosticos?idPaciente=${idPessoa}`);
                if (!res.ok)    throw new Error();
                const data = await res.json();
                setDiagnosticos(data);
            } catch {
                setErro("Não foi possível carregar os diagnósticos.");
            } finally {
                setCarregando(false);
            }
        };
        carregar();
    }, [idPessoa]);

    const formatarData = (iso: string) => new Date(iso).toLocaleString("pt-PT");

    return (
        <div className="min-h-screen bg-background font-sans p-4 pb-20">
            <h1 className="text-text text-xl font-semibold mb-4">Os meus diagnósticos</h1>

            {carregando && <p className="text-muted text-sm">A carregar...</p>}
            {erro && <p className="text-red-600 text-sm">{erro}</p>}
            {!carregando && !erro && diagnosticos.length === 0 && (
                <p className="text-muted text-sm">Ainda não existem diagnósticos registados.</p>
            )}

            <div className="flex flex-col gap-3">
                {diagnosticos.map((d) => (
                    <div key={d.id} className="border border-primary-outline rounded-2xl p-4 bg-background">
                        <span className="text-text font-semibold">{formatarData(d.date)}</span>
                        <p className="text-sm text-muted mt-1">{d.status}</p>
                        <div className="flex gap-4 mt-2 text-sm text-text">
                            <span>🌡 {d.temperatura} °C</span>
                            <span>❤ {d.bpm} bpm</span>
                            <span>📈 {d.magnitudeG} G</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DiagnosticosPage;