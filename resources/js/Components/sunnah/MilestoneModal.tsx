import { Icon } from '@iconify/react';
import { Milestone } from './JourneyProgressBar';

interface MilestoneModalProps {
    show: boolean;
    milestone: Milestone | null;
    totalPoin: number;
    onClose: () => void;
}

/** Modal perayaan saat guru melewati milestone 40/75/90/100 poin. */
export default function MilestoneModal({ show, milestone, totalPoin, onClose }: MilestoneModalProps) {
    if (!show || !milestone) {
        return null;
    }

    const percent = Math.min(100, Math.round((totalPoin / 100) * 100));
    const color = milestone.color ?? '#10b981';
    const reached = totalPoin >= milestone.point;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

            <div className="animate-scale-in relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-2xl sm:p-7">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition-all hover:bg-slate-200 hover:text-slate-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    title="Tutup Modal"
                    aria-label="Tutup"
                >
                    <Icon icon="mdi:close" className="text-xl" />
                </button>

                <div
                    className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full shadow-inner sm:h-20 sm:w-20"
                    style={{ background: `${color}20` }}
                >
                    <span className="text-3xl sm:text-4xl">{milestone.icon}</span>
                </div>

                <h2 className="mb-1 text-xl font-black tracking-tight sm:text-2xl" style={{ color }}>
                    {milestone.title}
                </h2>
                <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{milestone.text}</p>

                <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-left">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Target Milestone</span>
                        <span className="rounded-lg px-2 py-0.5 text-[11px] font-black text-white" style={{ background: color }}>
                            {milestone.point} Poin
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Poin Terkumpul Hari Ini</span>
                        <span className="font-black tabular-nums text-slate-900">
                            {totalPoin} / 100 <span className="font-bold text-slate-400">({percent}%)</span>
                        </span>
                    </div>

                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%`, background: color }}
                        />
                    </div>

                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                        <span className={`flex items-center gap-1 font-bold ${reached ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <Icon icon={reached ? 'mdi:check-circle' : 'mdi:target'} className="text-sm" />
                            {reached
                                ? 'Milestone ini sudah tercapai!'
                                : `Kurang ${Math.max(0, milestone.point - totalPoin)} poin lagi`}
                        </span>
                        <span className="font-bold tabular-nums text-slate-500">
                            Sisa menuju Ka&apos;bah: {Math.max(0, 100 - totalPoin)} poin
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
