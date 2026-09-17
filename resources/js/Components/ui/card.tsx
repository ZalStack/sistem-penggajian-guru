import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    headerAction?: ReactNode;
}

export function Card({ className, title, description, headerAction, children, ...props }: CardProps) {
    return (
        <div className={cn('bg-white rounded-2xl border border-gray-200 shadow-sm', className)} {...props}>
            {(title || description || headerAction) && (
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
                    </div>
                    {headerAction}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}
