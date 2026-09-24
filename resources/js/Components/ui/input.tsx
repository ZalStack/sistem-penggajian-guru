import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
    hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, hint, id, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={id} className="block text-[12.5px] font-[600] tracking-[-0.01em] text-slate-700">
                        {label} {props.required && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-slate-600 transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={id}
                        className={cn(
                            'input-modern',
                            icon && 'pl-10',
                            error && 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-400 bg-rose-50/20',
                            className
                        )}
                        {...props}
                    />
                </div>
                {hint && !error && <p className="text-[11px] leading-4 text-slate-500 font-[450]">{hint}</p>}
                {error && <p className="text-[11px] leading-4 text-rose-600 font-[600] flex items-center gap-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
