import { cn } from '@/lib/utils';

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline';
    size?: 'sm' | 'md';
    dot?: boolean;
    children: React.ReactNode;
    className?: string;
}

// Unified: neutral=s late, info=accent blue (#1e4db7), success=emerald, warning=amber, danger=rose
const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-slate-900 text-white border-slate-900 shadow-sm',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200', // maps to accent blue light
    outline: 'bg-white text-slate-600 border-slate-200',
};

const dotColors: Record<string, string> = {
    default: 'bg-slate-500',
    neutral: 'bg-white',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
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
