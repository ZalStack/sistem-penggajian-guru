import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: string;
    title?: string;
    description?: string;
    children?: ReactNode;
}

export default function EmptyState({ icon = 'lucide:inbox', title = 'Tidak ada data', description, children }: EmptyStateProps) {
    return (
        <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center mx-auto mb-5 shadow-soft">
                <Icon icon={icon} className="text-[28px] text-slate-400" />
            </div>
            <h3 className="text-[15px] font-[700] tracking-[-0.015em] text-slate-900">{title}</h3>
            {description && <p className="text-[13px] leading-5 text-slate-500 mt-2 max-w-sm mx-auto font-[450]">{description}</p>}
            {children && <div className="mt-6 flex justify-center">{children}</div>}
        </div>
    );
}
