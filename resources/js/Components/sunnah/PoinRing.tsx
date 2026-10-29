import { useId } from 'react';

interface PoinRingProps {
    /** Nilai poin yang sudah dianimasikan (boleh melebihi 100). */
    poin: number;
    /** Ukuran ring dalam pixel. */
    size?: number;
    className?: string;
}

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_COMET_LENGTH = 26;

/**
 * Progress ring melingkar dengan gradasi amber → emerald → amber.
 * Persentase mengikuti capaian harian (maksimal 100%).
 */
export default function PoinRing({ poin, size = 84, className }: PoinRingProps) {
    const gradientId = useId().replace(/:/g, '');
    const percent = Math.max(0, Math.min(100, Math.round(poin)));
    const dashOffset = RING_CIRCUMFERENCE * (1 - percent / 100);
    const cometVisible = percent > 0;

    return (
        <div
            className={`relative shrink-0 ${className ?? ''}`}
            style={{ width: size, height: size }}
            role="img"
            aria-label={`Progress ${percent} persen`}
        >
            {/* Aura hidup di belakang ring */}
            <div className="absolute -inset-1.5 rounded-full opacity-70 blur-md ring-aura" aria-hidden="true" />

            <svg viewBox="0 0 100 100" className="relative h-full w-full -rotate-90" aria-hidden="true">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                </defs>

                <circle cx="50" cy="50" r={RING_RADIUS} fill="none" strokeWidth="9" className="stroke-slate-100" />

                <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    stroke={`url(#${gradientId})`}
                    className="transition-[stroke-dashoffset] duration-1000 ease-out drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                    style={{
                        strokeDasharray: RING_CIRCUMFERENCE,
                        strokeDashoffset: dashOffset,
                    }}
                />

                {cometVisible && (
                    <circle
                        cx="50"
                        cy="50"
                        r={RING_RADIUS}
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="rgba(255,255,255,0.9)"
                        style={{
                            strokeDasharray: `${RING_COMET_LENGTH} ${RING_CIRCUMFERENCE - RING_COMET_LENGTH}`,
                            strokeDashoffset: dashOffset,
                        }}
                    />
                )}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center leading-none">
                <span className="text-base font-black tabular-nums text-slate-800 sm:text-lg">{percent}%</span>
            </div>
        </div>
    );
}
