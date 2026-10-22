import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

type StatColor =
    | 'slate' | 'success' | 'accent' | 'warning' | 'danger' | 'neutral'
    | 'gray' | 'grey' | 'blue' | 'indigo' | 'violet' | 'purple' | 'sky'
    | 'green' | 'emerald' | 'red' | 'rose' | 'amber' | 'orange' | 'pink';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: StatColor;
    description?: string;
    trend?: { value: number; isPositive: boolean; label?: string };
    className?: string;
    children?: ReactNode;
}

// Unified palette: gradient icon chips + tinted glow per color family
const colors: Record<string, { chip: string; glow: string; bar: string }> = {
    slate: { chip: 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_6px_14px_-6px_rgba(99,102,241,0.8)]', glow: 'bg-indigo-400/20', bar: 'from-indigo-500 to-violet-500' },
    neutral: { chip: 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-[0_6px_14px_-6px_rgba(71,85,105,0.8)]', glow: 'bg-slate-400/20', bar: 'from-slate-500 to-slate-700' },
    accent: { chip: 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-[0_6px_14px_-6px_rgba(79,70,229,0.8)]', glow: 'bg-indigo-500/20', bar: 'from-indigo-500 to-indigo-700' },
    success: { chip: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_6px_14px_-6px_rgba(16,185,129,0.8)]', glow: 'bg-emerald-400/20', bar: 'from-emerald-400 to-emerald-600' },
    warning: { chip: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_6px_14px_-6px_rgba(245,158,11,0.8)]', glow: 'bg-amber-400/20', bar: 'from-amber-400 to-orange-500' },
    danger: { chip: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_6px_14px_-6px_rgba(244,63,94,0.8)]', glow: 'bg-rose-400/20', bar: 'from-rose-400 to-rose-600' },
};

// Back-compat aliases
const alias: Record<string, string> = {
    gray: 'slate',
    grey: 'slate',
    blue: 'accent',
    indigo: 'accent',
    violet: 'slate',
    purple: 'slate',
    sky: 'accent',
    green: 'success',
    emerald: 'success',
    red: 'danger',
    rose: 'danger',
    amber: 'warning',
    orange: 'warning',
    pink: 'danger',
};

export default function StatCard({ title, value, icon, color = 'slate', description, trend, className, children }: StatCardProps) {
    const key = alias[color] ?? color;
    const c = colors[key] ?? colors.slate;
    return (
        <div className={cn('relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(79,70,229,0.05)] hover:shadow-[0_12px_26px_-8px_rgba(79,70,229,0.18)] hover:-translate-y-0.5 transition-all duration-300', className)}>
            <div className={cn('pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl', c.glow)} />
            <div className={cn('absolute top-0 left-0 h-1 w-full bg-gradient-to-r opacity-90', c.bar)} />
            <div className="relative flex items-start justify-between gap-4 pt-1.5">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-slate-500">{title}</p>
                    <p className="text-xl font-extrabold tracking-tight text-slate-900 mt-2 leading-none">{value}</p>
                    {description && <p className="text-xs text-slate-500 mt-1.5 leading-4">{description}</p>}
                    {trend && (
                        <div className="flex items-center gap-1.5 mt-3">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border', trend.isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200')}>
                                <Icon icon={trend.isPositive ? 'lucide:trending-up' : 'lucide:trending-down'} className="w-3 h-3" />
                                {trend.isPositive ? '+' : ''}{trend.value}%
                            </span>
                            {trend.label && <span className="text-[11px] text-slate-400 font-medium">{trend.label}</span>}
                        </div>
                    )}
                </div>
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white', c.chip)}>
                    <Icon icon={icon} className="w-5 h-5" />
                </div>
            </div>
            {children && <div className="relative mt-4 pt-4 border-t border-slate-100">{children}</div>}
        </div>
    );
}
