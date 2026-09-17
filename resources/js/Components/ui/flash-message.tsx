import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';

interface FlashMessageProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose?: () => void;
}

export default function FlashMessage({ type, message, onClose }: FlashMessageProps) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        setShow(true);
        if (message) {
            const timer = setTimeout(() => {
                setShow(false);
                onClose?.();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!show || !message) return null;

    const config = {
        success: {
            container: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900',
            iconBg: 'bg-emerald-500 text-white',
            icon: 'lucide:check',
            title: 'Berhasil',
        },
        error: {
            container: 'bg-rose-500/10 border-rose-500/20 text-rose-900',
            iconBg: 'bg-rose-500 text-white',
            icon: 'lucide:alert-circle',
            title: 'Terjadi Kesalahan',
        },
        warning: {
            container: 'bg-amber-500/10 border-amber-500/20 text-amber-900',
            iconBg: 'bg-amber-500 text-white',
            icon: 'lucide:alert-triangle',
            title: 'Peringatan',
        },
        info: {
            container: 'bg-blue-500/10 border-blue-500/20 text-blue-900',
            iconBg: 'bg-blue-500 text-white',
            icon: 'lucide:info',
            title: 'Informasi',
        },
    }[type];

    return (
        <div
            className={`border shadow-sm px-4 py-3.5 rounded-2xl flex items-center gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${config.container}`}
            role="alert"
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${config.iconBg}`}>
                <Icon icon={config.icon} className="text-base" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{config.title}</p>
                <p className="text-sm font-medium leading-snug">{message}</p>
            </div>
            <button
                type="button"
                onClick={() => {
                    setShow(false);
                    onClose?.();
                }}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-all text-current"
                aria-label="Tutup notifikasi"
            >
                <Icon icon="lucide:x" className="text-base" />
            </button>
        </div>
    );
}
