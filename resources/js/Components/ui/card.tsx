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
                <div className="px-6 sm:px-8 lg:px-8 py-6 border-b border-slate-200/60 flex items-center justify-between gap-4 bg-white">
                    <div className="min-w-0 space-y-1">
                        {title && <h3 className="text-[15px] font-[700] tracking-[-0.015em] text-slate-900 leading-5">{title}</h3>}
                        {description && <p className="text-[13px] leading-5 text-slate-500 font-[450]">{description}</p>}
                    </div>
                    {headerAction && <div className="shrink-0">{headerAction}</div>}
                </div>
            )}
            <div className={cn(noPadding ? '' : 'p-6 sm:p-8 lg:p-8', 'bg-white')}>{children}</div>
        </div>
    );
}
