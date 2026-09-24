import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef, AnchorHTMLAttributes } from 'react';

const baseStyles = 'inline-flex items-center justify-center gap-2 font-[600] tracking-[-0.01em] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none whitespace-nowrap';

const variantStyles: Record<string, string> = {
    default: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(15,23,42,0.12)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.14)] hover:-translate-y-[1px]',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus:ring-slate-900/10 shadow-sm hover:shadow',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-900/10 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-900/10 active:bg-slate-200/70',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600/20 shadow-sm hover:shadow-md hover:-translate-y-px',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600/20 shadow-sm hover:shadow-md hover:-translate-y-px',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500/20 shadow-sm hover:shadow-md',
};

const sizeStyles: Record<string, string> = {
    sm: 'px-3 py-[7px] text-[12.5px] gap-1.5 rounded-lg',
    default: 'px-[18px] py-[10px] text-[13px]',
    lg: 'px-6 py-3 text-[13px] rounded-[14px]',
    icon: 'p-2.5 aspect-square',
};

interface ButtonBaseProps {
    variant?: keyof typeof variantStyles;
    size?: keyof typeof sizeStyles;
    processing?: boolean;
    disabled?: boolean;
}

type ButtonAsButton = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };
type ButtonAsLink = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href: string };
type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', processing, disabled, as = 'button', children, ...props }, ref) => {
        const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

        if (as === 'a') {
            const linkProps = props as AnchorHTMLAttributes<HTMLAnchorElement>;
            return (
                <a ref={ref as React.Ref<HTMLAnchorElement>} className={classes} {...linkProps}>
                    {children}
                </a>
            );
        }

        const btnProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
        return (
            <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} disabled={disabled || processing} {...btnProps}>
                {processing && (
                    <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
export default Button;
