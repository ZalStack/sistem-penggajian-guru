import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    type: ToastType;
    message: string;
    onClose?: () => void;
}

const styles: Record<ToastType, { wrap: string; icon: string; bg: string }> = {
    success: {
        wrap: 'border-emerald-200 bg-white text-emerald-800',
        icon: 'mdi:check-circle',
        bg: 'bg-emerald-50 text-emerald-600',
    },
    error: {
        wrap: 'border-rose-200 bg-white text-rose-800',
        icon: 'mdi:alert-circle',
        bg: 'bg-rose-50 text-rose-600',
    },
    info: {
        wrap: 'border-indigo-200 bg-white text-indigo-800',
        icon: 'mdi:information',
        bg: 'bg-indigo-50 text-indigo-600',
    },
};

/** Toast kecil di tengah atas layar, dipakai untuk feedback simpan checklist. */
export default function Toast({ type, message, onClose }: ToastProps) {
    const style = styles[type];

    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[320] flex justify-center px-4">
            <div
                className={cn(
                    'animate-slide-down pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-float',
                    style.wrap,
                )}
                role="status"
                aria-live="polite"
            >
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', style.bg)}>
                    <Icon icon={style.icon} className="text-base" />
                </span>
                <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug">{message}</p>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Tutup notifikasi"
                    >
                        <Icon icon="mdi:close" className="text-sm" />
                    </button>
                )}
            </div>
        </div>
    );
}
