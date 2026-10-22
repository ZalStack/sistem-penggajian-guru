import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    headerAction?: ReactNode;
    noPadding?: boolean;
    variant?: 'default' | 'elevated' | 'interactive';
}

export function Card({ className, title, description, headerAction, noPadding, variant = 'default', children, ...props }: CardProps) {
    const variantClass =
        variant === 'elevated' ? 'card-elevated' :
        variant === 'interactive' ? 'card-interactive' :
        'card-modern';

    return (
        <div className={cn(variantClass, 'overflow-hidden', className)} {...props}>
            {(title || description || headerAction) && (
                <div className="px-5 sm:px-7 lg:px-8 py-5 sm:py-6 border-b border-indigo-100/70 flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40">
                    <div className="min-w-0 space-y-1">
                        {title && <h3 className="text-[15px] font-bold tracking-[-0.015em] text-slate-900 leading-5 flex items-center gap-2.5">
                            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 shrink-0" />
                            {title}
                        </h3>}
                        {description && <p className="text-[13px] leading-5 text-slate-500 font-medium pl-4">{description}</p>}
                    </div>
                    {headerAction && <div className="shrink-0">{headerAction}</div>}
                </div>
            )}
            <div className={cn(noPadding ? '' : 'p-5 sm:p-7 lg:p-8', 'bg-white')}>{children}</div>
        </div>
    );
}
