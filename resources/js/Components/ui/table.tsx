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
    return <thead className={cn('bg-slate-50/70 border-y border-slate-200/70', className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn('group/row hover:bg-slate-50/60 transition-colors duration-200', className)} {...props} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn('px-6 py-4 text-left text-[11px] font-[700] tracking-[0.06em] text-slate-500 uppercase whitespace-nowrap', className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('px-6 py-5 text-[13.5px] leading-5 text-slate-700 whitespace-nowrap align-middle', className)} {...props} />;
}
