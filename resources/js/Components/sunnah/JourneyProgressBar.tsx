import { Icon } from '@iconify/react';

export interface Milestone {
    point: number;
    icon: string;
    title: string;
    text?: string;
    color?: string;
}

interface JourneyProgressBarProps {
    progress: number;
    totalPoin: number;
    milestones?: Milestone[];
    className?: string;
}

const defaultMilestones: Milestone[] = [
    { point: 40, icon: '🔥', title: '40 Poin' },
    { point: 75, icon: '🎉', title: '75 Poin' },
    { point: 90, icon: '🌟', title: '90 Poin' },
    { point: 100, icon: '🏆', title: '100 Poin' },
];

/** Perjalanan kafilah gurun menuju Ka'bah — visual progress poin harian. */
export default function JourneyProgressBar({
    progress,
    totalPoin,
    milestones = defaultMilestones,
    className,
}: JourneyProgressBarProps) {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress ?? 0)));
    const intermediateMilestones = milestones.filter((milestone) => milestone.point > 0 && milestone.point < 100);
    const isReached = (milestone: Milestone) => totalPoin >= milestone.point;

    const shift = clampedProgress >= 92 ? '-90%' : clampedProgress <= 6 ? '-10%' : '-50%';

    const narration = (() => {
        if (totalPoin <= 0) {
            return 'Bismillah, mulailah mencentang amalan sunnah untuk memberangkatkan kafilah.';
        }
        if (totalPoin < 40) {
            return 'Kafilah berangkat! Semangat terus ibadahnya! 🔥';
        }
        if (totalPoin < 75) {
            return 'Pos 1 tercapai! Luar biasa, terus melangkah! 🎉';
        }
        if (totalPoin < 90) {
            return 'Pos 2 tercapai! Hampir sampai, jangan menyerah! 🌟';
        }
        if (totalPoin < 100) {
            return "Masyaallah! Hampir tiba di Ka'bah Al-Mukarramah! 🕋";
        }

        return "Maa Syaa Allah! Perjalanan sempurna 100 poin telah tuntas hari ini! 🕋";
    })();

    return (
        <div className={`relative w-full select-none ${className ?? ''}`}>
            <div
                className="relative w-full overflow-hidden rounded-2xl border border-sky-200/60 text-slate-800 shadow-xl sm:rounded-3xl"
                style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #bae6fd 25%, #fef3c7 60%, #fed7aa 80%, #fbbf24 100%)' }}
            >
                {/* Dekorasi awan & matahari */}
                <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
                    <div className="absolute left-8 top-2 h-6 w-16 rounded-full bg-white/60 blur-md" />
                    <div className="absolute left-16 top-3 h-4 w-10 rounded-full bg-white/50 blur-sm" />
                    <div className="absolute right-16 top-1.5 h-6 w-20 rounded-full bg-white/55 blur-md" />
                    <div className="absolute right-24 top-3 h-4 w-12 rounded-full bg-white/45 blur-sm" />
                    <div className="absolute right-4 top-2 hidden h-8 w-8 rounded-full bg-amber-300 opacity-90 shadow-[0_0_16px_rgba(251,191,36,0.8)] sm:block sm:h-10 sm:w-10" />
                </div>

                {/* Judul */}
                <div className="relative z-10 flex items-center justify-between gap-2 px-3.5 pb-1.5 pt-3 sm:px-5">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="text-base leading-none sm:text-lg">🐪</span>
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-black tracking-tight text-slate-700 sm:text-xs">
                                Perjalanan Menuju Ka&apos;bah
                            </p>
                            <p className="truncate text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                                Dari Titik 0 hingga Baitullah
                            </p>
                        </div>
                    </div>
                </div>

                {/* Jalur, onta, dan checkpoint */}
                <div className="relative z-10 px-3.5 pb-3 pt-20 sm:px-6 sm:pt-24">
                    {/* Bukit pasir */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-14 overflow-hidden" aria-hidden="true">
                        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute bottom-0 h-10 w-full fill-[#fcd34d] opacity-60">
                            <path d="M0,50 Q360,10 720,40 T1440,25 L1440,100 L0,100 Z" />
                        </svg>
                        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute bottom-0 h-7 w-full fill-[#fbbf24] opacity-80">
                            <path d="M0,60 Q480,15 960,45 T1440,35 L1440,100 L0,100 Z" />
                        </svg>
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#f59e0b] to-transparent opacity-60" />
                    </div>

                    <div className="relative z-10 w-full">
                        {/* Jalur dasar */}
                        <div className="relative h-3 w-full overflow-hidden rounded-full border-2 border-amber-300/80 bg-white/70 shadow-[0_3px_10px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(0,0,0,0.08)] sm:h-4">
                            <div
                                className="absolute bottom-0 left-0 top-0 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] transition-[width] duration-700 ease-out"
                                style={{ width: `${clampedProgress}%` }}
                            >
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="h-full w-full -translate-x-full animate-jbar-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                </div>
                                <div className="absolute right-0 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-amber-400 bg-white shadow-[0_0_10px_#fbbf24] sm:h-4 sm:w-4" />
                            </div>

                            {intermediateMilestones.map((milestone) => (
                                <span
                                    key={`divider-${milestone.point}`}
                                    className="absolute bottom-0 top-0 z-[5] w-0.5 bg-amber-200/70"
                                    style={{ left: `${milestone.point}%` }}
                                />
                            ))}
                        </div>

                        {/* Checkpoint milestone di atas jalur */}
                        {intermediateMilestones.map((milestone) => {
                            const reached = isReached(milestone);

                            return (
                                <div
                                    key={`milestone-${milestone.point}`}
                                    className="absolute z-20 flex -translate-x-1/2 flex-col items-center"
                                    style={{ left: `${milestone.point}%`, bottom: 'calc(100% + 4px)' }}
                                >
                                    <div
                                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-md transition-all duration-300 sm:h-6 sm:w-6 ${
                                            reached
                                                ? 'border-amber-600 bg-amber-400 shadow-amber-300/60 ring-2 ring-amber-300/40'
                                                : 'border-amber-300 bg-white/80'
                                        }`}
                                    >
                                        {reached ? (
                                            <span className="text-[9px] font-black text-white sm:text-[10px]">✓</span>
                                        ) : (
                                            <span className="text-[8px] font-black text-amber-600 sm:text-[9px]">{milestone.point}</span>
                                        )}
                                    </div>
                                    <span className={`-mt-1 h-1.5 w-1.5 rotate-45 ${reached ? 'bg-amber-400' : 'bg-amber-300'}`} />
                                </div>
                            );
                        })}

                        {/* Onta berjalan di sepanjang jalur */}
                        <div
                            className="pointer-events-none absolute z-30 transition-[left] duration-700 ease-out"
                            style={{ left: `${clampedProgress}%`, bottom: 'calc(100% - 2px)', transform: `translateX(${shift})` }}
                        >
                            <div className="mb-0.5 flex flex-col items-center">
                                <div className="animate-jbar-float whitespace-nowrap rounded-full border border-amber-400 bg-white/95 px-2 py-0.5 text-[9px] font-black text-amber-700 shadow-md shadow-amber-200/60 sm:text-[10px]">
                                    {clampedProgress >= 100 ? "Tiba di Ka'bah! 🕋" : `🐪 ${totalPoin} Poin`}
                                </div>
                                <span className="-mt-0.5 h-1.5 w-1.5 rotate-45 bg-amber-400" />
                            </div>

                            <div className="animate-jbar-walk relative flex h-16 w-16 items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] sm:h-20 sm:w-20">
                                <CamelSvg />
                            </div>
                        </div>

                        {/* Landmark awal */}
                        <div className="absolute left-0 top-1/2 z-20 flex -translate-y-1/2 items-center">
                            <div className="flex h-12 w-12 items-center justify-center filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] sm:h-16 sm:w-16">
                                <span className="text-4xl leading-none sm:text-5xl">🌴</span>
                            </div>
                        </div>

                        {/* Landmark akhir: Ka'bah */}
                        <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2">
                            <div
                                className={`relative flex h-16 w-16 items-center justify-center filter transition-all duration-300 sm:h-20 sm:w-20 ${
                                    clampedProgress >= 100
                                        ? 'animate-jbar-glow drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]'
                                        : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]'
                                }`}
                            >
                                <KaabaSvg />
                            </div>
                            {clampedProgress >= 100 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-90" />
                                    <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-amber-400 text-[8px] font-black text-slate-950">
                                        ★
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Label di bawah jalur */}
                    <div className="relative z-10 mt-2 flex items-start justify-between sm:mt-2.5">
                        <div className="flex max-w-[38%] flex-col items-start">
                            <span className="text-[10px] font-black leading-tight text-emerald-600 sm:text-[11px]">🌴 Titik Mulai</span>
                        </div>
                        <div className="hidden flex-col items-center gap-0.5 sm:flex">
                            <div className="flex items-center gap-2.5">
                                {intermediateMilestones.map((milestone) => (
                                    <span
                                        key={`label-${milestone.point}`}
                                        className={`text-[9px] font-bold leading-tight ${isReached(milestone) ? 'text-amber-600' : 'text-slate-400'}`}
                                    >
                                        {milestone.icon} {milestone.point}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex max-w-[38%] flex-col items-end">
                            <span className="text-[10px] font-black leading-tight text-amber-600 sm:text-[11px]">🕋 Ka&apos;bah</span>
                        </div>
                    </div>
                </div>

                {/* Narasi perjalanan */}
                <div className="relative z-10 flex items-center gap-1.5 border-t border-amber-200/60 bg-amber-50/80 px-3.5 py-2 text-[10px] backdrop-blur-sm sm:px-5 sm:text-[11px]">
                    <Icon icon="mdi:creation" className="shrink-0 text-amber-500" />
                    <span className="truncate font-medium text-amber-700">{narration}</span>
                </div>
            </div>
        </div>
    );
}

function CamelSvg() {
    return (
        <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="94" rx="34" ry="4.5" fill="rgba(0,0,0,0.18)" />
            <path d="M34 68 L32 90 L37 91" stroke="#9A6B3A" strokeWidth="5" strokeLinecap="round" />
            <path d="M64 68 L66 90 L71 91" stroke="#9A6B3A" strokeWidth="5" strokeLinecap="round" />
            <path d="M24 64 C24 52 34 46 42 54 C46 45 56 45 61 54 C70 50 78 58 78 67 C78 77 68 82 50 82 C30 82 24 75 24 64 Z" fill="#D49A58" />
            <path d="M42 70 L42 92 L47 93" stroke="#B87D43" strokeWidth="5" strokeLinecap="round" />
            <path d="M58 70 L60 92 L65 93" stroke="#B87D43" strokeWidth="5" strokeLinecap="round" />
            <path d="M70 65 C74 58 78 48 80 38 C82 32 88 30 92 32 C95 34 96 38 92 40 C87 44 84 53 76 69" stroke="#D49A58" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="85" cy="30" r="2.5" fill="#9A6B3A" />
            <ellipse cx="90" cy="34" rx="4.5" ry="3" fill="#B87D43" />
            <circle cx="87" cy="33" r="1.2" fill="#2E1C0C" />
            <path d="M24 66 C20 72 18 78 20 83" stroke="#9A6B3A" strokeWidth="3" strokeLinecap="round" />
            <path d="M38 54 Q50 58 62 54 L64 67 Q50 71 36 67 Z" fill="#B45309" stroke="#FBBF24" strokeWidth="1.8" />
            <path d="M42 59 H58" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
            <path d="M44 50 C44 41 48 37 52 37 C56 37 60 41 60 50 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.8" />
            <path d="M46 44 L58 50" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="52" cy="31" r="5.5" fill="#E2E8F0" />
            <ellipse cx="52" cy="29" rx="6" ry="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
            <path d="M57 44 Q70 44 82 38" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="2.5 1.5" />
        </svg>
    );
}

function KaabaSvg() {
    return (
        <svg viewBox="0 0 50 50" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="42" width="42" height="4" rx="1.5" fill="#94A3B8" stroke="#CBD5E1" strokeWidth="0.8" />
            <rect x="7" y="10" width="36" height="32" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <rect x="7" y="17" width="36" height="6" fill="#F59E0B" />
            <line x1="7" y1="20" x2="43" y2="20" stroke="#FEF3C7" strokeWidth="1.2" strokeDasharray="3 1.5" />
            <rect x="28" y="24" width="10" height="17" rx="1.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <circle cx="9.5" cy="40.5" r="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
            <circle cx="9.5" cy="40.5" r="1" fill="#0F172A" />
            <rect x="18" y="8" width="5" height="2.5" rx="0.5" fill="#FBBF24" />
        </svg>
    );
}
