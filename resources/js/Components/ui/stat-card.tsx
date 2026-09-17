import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: 'gray' | 'green' | 'blue' | 'purple' | 'amber' | 'red';
    description?: string;
    className?: string;
}

const colors: Record<string, string> = {
    gray: 'bg-gray-50 text-gray-600',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
};

export default function StatCard({ title, value, icon, color = 'gray', description, className }: StatCardProps) {
    return (
        <div className={cn('bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
                </div>
                <div className={cn('p-3 rounded-xl', colors[color])}>
                    <Icon icon={icon} className="text-xl" />
                </div>
            </div>
        </div>
    );
}
