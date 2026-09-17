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
        <div className="text-center py-12">
            <Icon icon={icon} className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}
