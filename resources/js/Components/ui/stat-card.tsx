import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: 'slate' | 'success' | 'accent' | 'warning' | 'danger' | 'neutral';
    description?: string;
    trend?: { value: number; isPositive: boolean; label?: string };
    className?: string;
    children?: ReactNode;
}

// Unified palette: slate neutral, accent blue, success emerald, warning amber, danger rose
const colors: Record<string, { bg: string; icon: string; ring: string }> = {
    slate: { bg: 'bg-white border border-slate-200', icon: 'text-slate-600', ring: 'ring-slate-200' },
    neutral: { bg: 'bg-slate-900', icon: 'text-white', ring: 'ring-slate-900' },
    accent: { bg: 'bg-sky-50 border border-sky-200', icon: 'text-sky-600', ring: 'ring-sky-200' },
    success: { bg: 'bg-emerald-50 border border-emerald-200', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
    warning: { bg: 'bg-amber-50 border border-amber-200', icon: 'text-amber-600', ring: 'ring-amber-200' },
    danger: { bg: 'bg-rose-50 border border-rose-200', icon: 'text-rose-600', ring: 'ring-rose-200' },
};

// Back-compat aliases
const alias: Record<string, string> = {
    gray: 'slate',
    grey: 'slate',
    blue: 'accent',
    indigo: 'accent',
    violet: 'accent',
    purple: 'accent',
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
        <div className={cn('rounded-[16px] bg-white border border-slate-200 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-200', className)}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-500">{title}</p>
                    <p className="text-xl font-semibold tracking-tight text-slate-900 mt-2 leading-none">{value}</p>
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
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
                    <Icon icon={icon} className={cn('w-5 h-5', c.icon)} />
                </div>
            </div>
            {children && <div className="mt-4 pt-4 border-t border-slate-100">{children}</div>}
        </div>
    );
}
