import { Icon } from '@iconify/react';

export interface HistoryDay {
    iso: string;
    tanggal: string;
    hari?: number;
    poin: number;
    status?: string;
    status_approval?: string;
    is_today?: boolean;
    is_selected?: boolean;
}

interface MonthlyHistoryGridProps {
    days: HistoryDay[];
    monthLabel: string;
    onSelect?: (iso: string) => void;
}

/** Riwayat poin harian bulan berjalan dalam grid 5/10 kolom. */
export default function MonthlyHistoryGrid({ days, monthLabel, onSelect }: MonthlyHistoryGridProps) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Icon icon="mdi:calendar-month" className="text-lg text-teal-600" />
                    <h3 className="text-xs font-bold text-slate-800 sm:text-sm">Riwayat Poin Bulan Ini</h3>
                </div>
                <span className="rounded-full border border-teal-200/60 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                    {monthLabel || 'Bulan Ini'}
                </span>
            </div>

            <div className="grid grid-cols-5 gap-x-2 gap-y-3.5 sm:grid-cols-10">
                {days.map((day) => {
                    const selectable = Boolean(onSelect) && (day.is_today || day.status_approval !== undefined);
                    const content = (
                        <>
                            <span
                                className={`mb-1 truncate text-[9px] font-medium sm:text-[10px] ${
                                    day.is_selected ? 'font-bold text-indigo-600' : day.is_today ? 'font-bold text-teal-600' : 'text-slate-500'
                                }`}
                            >
                                {day.tanggal}
                            </span>

                            <div
                                className={`relative h-3.5 w-full overflow-hidden rounded-md sm:h-4 ${
                                    day.is_selected ? 'bg-teal-100 ring-1 ring-teal-300' : 'bg-slate-100'
                                }`}
                            >
                                {day.poin > 0 && (
                                    <div
                                        className="h-full rounded-md bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-400"
                                        style={{ width: `${Math.min((day.poin / 100) * 100, 100)}%` }}
                                    />
                                )}
                            </div>

                            <span className={`mt-1 text-[10px] font-bold sm:text-[11px] ${day.is_selected ? 'text-teal-700' : 'text-slate-700'}`}>
                                {day.poin}
                            </span>
                        </>
                    );

                    return selectable ? (
                        <button
                            type="button"
                            key={day.iso}
                            onClick={() => onSelect?.(day.iso)}
                            className="flex flex-col items-center rounded-lg transition-colors hover:bg-slate-50"
                            title={`${day.tanggal} — ${day.poin} poin${day.status ? ` (${day.status})` : ''}`}
                        >
                            {content}
                        </button>
                    ) : (
                        <div key={day.iso} className="flex flex-col items-center" title={`${day.tanggal} — ${day.poin} poin`}>
                            {content}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-500" /> Hari ini
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" /> Tanggal dipilih
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-sm bg-gradient-to-r from-teal-500 to-amber-400" /> Poin harian (maks. 100)
                </span>
            </div>
        </div>
    );
}
