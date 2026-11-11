import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';

interface FlashMessageProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose?: () => void;
}

export default function FlashMessage({ type, message, onClose }: FlashMessageProps) {
    const [show, setShow] = useState(true);
    const [progress, setProgress] = useState(100);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!message) return;
        setShow(true);
        setProgress(100);

        // Do not auto-dismiss errors so critical messages/passwords are never lost
        if (type === 'error') {
            return;
        }

        const duration = 6000;
        const intervalTime = 100;
        const step = (100 / (duration / intervalTime));

        const interval = setInterval(() => {
            if (!isHovered) {
                setProgress((p) => {
                    const next = p - step;
                    if (next <= 0) {
                        clearInterval(interval);
                        setShow(false);
                        onClose?.();
                        return 0;
                    }
                    return next;
                });
            }
        }, intervalTime);

        return () => {
            clearInterval(interval);
        };
    }, [message, type, isHovered, onClose]);

    if (!show || !message) return null;

    const config = {
        success: {
            container: 'bg-white border-slate-200/70 text-slate-900 shadow-float',
            accent: 'bg-emerald-500',
            icon: 'tabler:check',
            iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
            title: 'Berhasil',
        },
        error: {
            container: 'bg-white border-rose-200 text-slate-900 shadow-float',
            accent: 'bg-rose-500',
            icon: 'tabler:alert-circle',
            iconBg: 'bg-rose-50 text-rose-600 ring-rose-200',
            title: 'Gagal',
        },
        warning: {
            container: 'bg-white border-amber-200 text-slate-900 shadow-float',
            accent: 'bg-amber-500',
            icon: 'tabler:alert-triangle',
            iconBg: 'bg-amber-50 text-amber-600 ring-amber-200',
            title: 'Perhatian',
        },
        info: {
            container: 'bg-white border-indigo-200 text-slate-900 shadow-float',
            accent: 'bg-gradient-to-b from-indigo-500 to-violet-500',
            icon: 'tabler:info-circle',
            iconBg: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
            title: 'Info',
        },
    }[type];

    return (
        <div
            className={`relative overflow-hidden border rounded-2xl flex items-center gap-4 px-4 py-3.5 shadow-float animate-slide-down ${config.container}`}
            role="alert"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${config.iconBg}`}>
                <Icon icon={config.icon} className="text-[18px]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold tracking-[0.08em] text-slate-500 uppercase">{config.title}</p>
                <p className="text-sm font-semibold tracking-[-0.01em] leading-5 text-slate-900 mt-0.5">{message}</p>
            </div>
            <button
                type="button"
                onClick={() => { setShow(false); onClose?.(); }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Tutup pemberitahuan"
            >
                <Icon icon="tabler:x" className="text-[16px]" />
            </button>
            {type !== 'error' && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-slate-900/10 w-full">
                    <div className={`h-full transition-all duration-100 ease-linear ${config.accent}`} style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
}
