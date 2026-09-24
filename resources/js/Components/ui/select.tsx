import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
    placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, id, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={id} className="block text-[12.5px] font-[600] tracking-[-0.01em] text-slate-700">
                        {label} {props.required && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                )}
                <div className="relative group">
                    <select
                        ref={ref}
                        id={id}
                        className={cn(
                            'select-modern pr-10',
                            error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10 bg-rose-50/20',
                            className
                        )}
                        {...props}
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 group-focus-within:text-slate-600 transition-colors">
                        <Icon icon="lucide:chevron-down" className="text-[16px]" />
                    </div>
                </div>
                {error && <p className="text-[11px] leading-4 text-rose-600 font-[600]">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';
export default Select;
