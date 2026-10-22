import { cn } from '@/lib/utils';

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline' | 'purple' | 'violet';
    size?: 'sm' | 'md';
    dot?: boolean;
    children: React.ReactNode;
    className?: string;
}

// Unified: neutral=brand gradient, info=indigo, success=emerald, warning=amber, danger=rose
const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    outline: 'bg-white text-slate-600 border-slate-200',
};

const dotColors: Record<string, string> = {
    default: 'bg-slate-500',
    neutral: 'bg-white',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-indigo-500',
    outline: 'bg-slate-400',
};

const sizes = {
    sm: 'px-2 py-1 text-[10px] leading-none',
    md: 'px-2.5 py-1 text-[11px] leading-none',
};

export default function Badge({ variant = 'default', size = 'md', dot = false, children, className }: BadgeProps) {
    // Back-compat: map legacy purple/violet to info (accent)
    const normalized = variant === ('purple' as any) || variant === ('violet' as any) ? 'info' : variant;
    const v = variants[normalized] ?? variants.default;
    const d = dotColors[normalized] ?? dotColors.default;
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide uppercase border', sizes[size], v, className)}>
            {dot && <span className={cn('w-1.5 h-1.5 rounded-full', d)} />}
            {children}
        </span>
    );
}
