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

    useEffect(() => {
        if (!message) return;
        setShow(true);
        setProgress(100);
        const interval = setInterval(() => {
            setProgress((p) => Math.max(0, p - (100 / 50)));
        }, 100);
        const timer = setTimeout(() => {
            setShow(false);
            onClose?.();
        }, 5200);
        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [message, onClose]);

    if (!show || !message) return null;

    const config = {
        success: {
            container: 'bg-white border-slate-200/70 text-slate-900 shadow-float',
            accent: 'bg-emerald-500',
            icon: 'lucide:check',
            iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
            title: 'Berhasil',
        },
        error: {
            container: 'bg-white border-rose-200 text-slate-900 shadow-float',
            accent: 'bg-rose-500',
            icon: 'lucide:alert-circle',
            iconBg: 'bg-rose-50 text-rose-600 ring-rose-200',
            title: 'Gagal',
        },
        warning: {
            container: 'bg-white border-amber-200 text-slate-900 shadow-float',
            accent: 'bg-amber-500',
            icon: 'lucide:alert-triangle',
            iconBg: 'bg-amber-50 text-amber-600 ring-amber-200',
            title: 'Perhatian',
        },
        info: {
            container: 'bg-white border-sky-200 text-slate-900 shadow-float',
            accent: 'bg-sky-500',
            icon: 'lucide:info',
            iconBg: 'bg-sky-50 text-sky-600 ring-sky-200',
            title: 'Info',
        },
    }[type];

    return (
        <div
            className={`relative overflow-hidden border rounded-2xl flex items-center gap-4 px-4 py-4 animate-slide-down ${config.container}`}
            role="alert"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${config.iconBg}`}>
                <Icon icon={config.icon} className="text-[18px]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-[800] tracking-[0.08em] text-slate-500 uppercase">{config.title}</p>
                <p className="text-[13.5px] font-[600] tracking-[-0.01em] leading-5 text-slate-900 mt-0.5">{message}</p>
            </div>
            <button
                type="button"
                onClick={() => { setShow(false); onClose?.(); }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Tutup"
            >
                <Icon icon="lucide:x" className="text-[16px]" />
            </button>
            <div className="absolute bottom-0 left-0 h-0.5 bg-slate-900/10 w-full">
                <div className={`h-full transition-all duration-100 ease-linear ${config.accent}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}
