import { cn } from '@/lib/utils';
import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="overflow-x-auto -mx-6 sm:-mx-8 lg:-mx-8">
            <div className="inline-block min-w-full align-middle px-6 sm:px-8 lg:px-8">
                <table className={cn('w-full text-sm', className)} {...props} />
            </div>
        </div>
    );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={cn('bg-gradient-to-r from-indigo-50/70 to-violet-50/50 border-y border-indigo-100/70', className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn('group/row hover:bg-indigo-50/40 transition-colors duration-200', className)} {...props} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn('px-6 py-4 text-left text-[11px] font-bold tracking-[0.06em] text-indigo-900/70 uppercase whitespace-nowrap', className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('px-6 py-5 text-[13.5px] leading-5 text-slate-700 whitespace-nowrap align-middle', className)} {...props} />;
}
