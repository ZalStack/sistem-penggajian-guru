import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef, AnchorHTMLAttributes } from 'react';

const baseStyles = 'inline-flex items-center justify-center gap-2 font-[600] tracking-[-0.01em] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none whitespace-nowrap';

const variantStyles: Record<string, string> = {
    default: 'text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:ring-indigo-500/40 shadow-[0_6px_16px_-6px_rgba(79,70,229,0.6)] hover:shadow-[0_10px_22px_-6px_rgba(124,58,237,0.65)] hover:-translate-y-[1px]',
    secondary: 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 focus:ring-indigo-500/30 shadow-sm hover:shadow',
    outline: 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 focus:ring-indigo-500/30 shadow-sm',
    ghost: 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 focus:ring-indigo-500/25 active:bg-indigo-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600/30 shadow-[0_6px_16px_-8px_rgba(225,29,72,0.8)] hover:shadow-[0_10px_22px_-8px_rgba(225,29,72,0.9)] hover:-translate-y-px',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600/30 shadow-[0_6px_16px_-8px_rgba(5,150,105,0.8)] hover:shadow-[0_10px_22px_-8px_rgba(5,150,105,0.9)] hover:-translate-y-px',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500/30 shadow-[0_6px_16px_-8px_rgba(217,119,6,0.8)] hover:shadow-md',
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
