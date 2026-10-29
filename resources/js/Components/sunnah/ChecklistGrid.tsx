import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export interface PoinConfigItem {
    label: string;
    poin: number;
    icon: string;
    has_jamaah: boolean;
}

interface ChecklistGridProps {
    config: Record<string, PoinConfigItem>;
    state: Record<string, boolean>;
    disabled?: boolean;
    onToggle: (key: string) => void;
}

const iconStyle: Record<string, { icon: string; background: string }> = {
    sholat_subuh: { icon: 'text-amber-500', background: 'bg-amber-50' },
    sholat_zuhur: { icon: 'text-amber-500', background: 'bg-amber-50' },
    sholat_asar: { icon: 'text-amber-500', background: 'bg-amber-50' },
    sholat_maghrib: { icon: 'text-purple-500', background: 'bg-purple-50' },
    sholat_isya: { icon: 'text-amber-500', background: 'bg-amber-50' },
    sholat_tahajud: { icon: 'text-amber-500', background: 'bg-amber-50' },
    infaq_sedekah: { icon: 'text-amber-500', background: 'bg-amber-50' },
    dzikir_sholawat: { icon: 'text-rose-400', background: 'bg-rose-50' },
    tilawah_quran: { icon: 'text-sky-500', background: 'bg-sky-50' },
    sholat_dhuha: { icon: 'text-orange-500', background: 'bg-orange-50' },
    menjaga_wudhu: { icon: 'text-blue-500', background: 'bg-blue-50' },
    puasa_sunnah: { icon: 'text-amber-500', background: 'bg-amber-50' },
};

export default function ChecklistGrid({ config, state, disabled = false, onToggle }: ChecklistGridProps) {
    return (
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(config).map(([key, item]) => {
                const checked = Boolean(state[key]);
                const style = iconStyle[key] ?? { icon: 'text-indigo-500', background: 'bg-indigo-50' };

                return (
                    <button
                        type="button"
                        key={key}
                        onClick={() => onToggle(key)}
                        disabled={disabled}
                        role="checkbox"
                        aria-checked={checked}
                        className={cn(
                            'group relative flex select-none items-center justify-between rounded-xl border p-3 text-left transition-all duration-200',
                            checked
                                ? 'border-slate-300 bg-slate-100/90 shadow-sm ring-1 ring-slate-400/20'
                                : 'border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/70',
                            disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
                        )}
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', style.background)}>
                                <Icon icon={item.icon} className={cn('text-lg', style.icon)} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold leading-snug text-slate-800">{item.label}</p>
                                {item.has_jamaah ? (
                                    <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                                        <span className="text-amber-500">👑</span>
                                        <span>berjamaah</span>
                                    </div>
                                ) : (
                                    <p className="mt-0.5 text-[10px] font-semibold text-emerald-700">{item.poin} poin</p>
                                )}
                            </div>
                        </div>

                        <div className="ml-2 shrink-0">
                            <div
                                className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-150',
                                    checked
                                        ? 'border-slate-950 bg-slate-950 text-white shadow-sm ring-1 ring-slate-950/50'
                                        : 'border-slate-600 bg-slate-200 group-hover:border-slate-800 group-hover:bg-slate-100',
                                )}
                            >
                                {checked && <Icon icon="mdi:check-bold" className="text-xs text-white" />}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
