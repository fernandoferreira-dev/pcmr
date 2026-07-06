import { BadgePlus, ClipboardList, CalendarDays, Stethoscope } from 'lucide-react';

const diagnostics = [
  { id: '???', patient: '???', date: '???', status: '???' },
];

export default function DadosDiagnostico() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-4xl bg-(--background) p-3 shadow-inner sm:p-4">
      <div className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
        <section className="grid gap-3 md:grid-cols-2">
          <article className="flex items-center justify-between rounded-3xl border border-[#a9a9a9] bg-[#ececec] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:px-5 sm:py-4">
            <div>
              <p className="text-base font-semibold text-[#565656] sm:text-lg">Pacientes</p>
              <p className="mt-1 text-2xl font-black text-[#111111] sm:text-[2rem]">Número</p>
              <p className="text-sm text-[#5e5e5e]">Percentagem</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d6d6d6] bg-white text-[#a8b6a3] shadow-sm sm:h-16 sm:w-16">
              <Stethoscope size={32} strokeWidth={1.7} />
            </div>
          </article>

          <article className="flex items-center justify-between rounded-3xl border border-[#a9a9a9] bg-[#ececec] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:px-5 sm:py-4">
            <div>
              <p className="text-base font-semibold text-[#565656] sm:text-lg">Diagnósticos</p>
              <p className="mt-1 text-2xl font-black text-[#111111] sm:text-[2rem]">Número</p>
              <p className="text-sm text-[#5e5e5e]">Percentagem</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d6d6d6] bg-white text-[#a8b6a3] shadow-sm sm:h-16 sm:w-16">
              <ClipboardList size={32} strokeWidth={1.7} />
            </div>
          </article>
        </section>

        <section className="rounded-[1.6rem] border border-[#a9a9a9] bg-[#dedede] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div>
                <p className="text-sm font-semibold text-[#565656]">Filtrar por data:</p>
              </div>

              <label className="flex flex-col gap-1 text-sm font-medium text-[#4f4f4f]">
                <span className="ml-1 text-sm font-semibold">Data de Início:</span>
                <span className="flex h-10 items-center gap-2 rounded-full border border-[#a5a5a5] bg-[#efefef] px-3 text-[#555] shadow-inner sm:h-11">
                  <CalendarDays size={15} />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#8a8a8a]"
                    type="date"
                    defaultValue="2026-10-01"
                  />
                </span>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-[#4f4f4f]">
                <span className="ml-1 text-sm font-semibold">Data de Fim:</span>
                <span className="flex h-10 items-center gap-2 rounded-full border border-[#a5a5a5] bg-[#efefef] px-3 text-[#555] shadow-inner sm:h-11">
                  <CalendarDays size={15} />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#8a8a8a]"
                    type="date"
                    defaultValue="2026-10-15"
                  />
                </span>
              </label>
            </div>

            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#949494] bg-[#d8d8d8] px-4 text-sm font-semibold text-[#4d4d4d] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:bg-[#d0d0d0] lg:mb-1">
              <BadgePlus size={15} />
              Aplicar Filtro
            </button>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-[1.2rem] border border-transparent px-1 pt-1">
          <h1 className="px-3 text-[1.5rem] font-semibold text-[#555555] sm:text-[1.75rem]">
            Histórico de Diagnósticos
          </h1>

          <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-[1.6rem] border border-[#a9a9a9] bg-[#ececec] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-4">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.1rem] border border-[#c3c3c3] bg-[#f4f4f4]">
              <div className="grid grid-cols-[0.9fr_1.2fr_1fr_0.8fr] gap-3 border-b border-[#d0d0d0] bg-[#e9e9e9] px-4 py-3 text-sm font-semibold text-[#5a5a5a]">
                <span>???</span>
                <span>???</span>
                <span>???</span>
                <span>???</span>
              </div>

              <div className="flex-1 overflow-hidden divide-y divide-[#dddddd]">
                {diagnostics.map((item) => (
                  <div key={item.id} className="grid grid-cols-[0.9fr_1.2fr_1fr_0.8fr] items-center gap-3 px-4 py-3 text-sm text-[#505050]">
                    <div className="flex items-center gap-2">
                      <button className="inline-flex h-8 items-center rounded-full border border-[#a5a5a5] bg-[#e8e8e8] px-3 text-xs font-semibold text-[#4d4d4d] shadow-sm transition hover:bg-[#e1e1e1]">
                        Exportar
                      </button>
                      <span className="font-semibold text-[#404040]">{item.id}</span>
                    </div>
                    <span>{item.patient}</span>
                    <span>{item.date}</span>
                    <span>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}