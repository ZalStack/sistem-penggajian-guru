import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef, AnchorHTMLAttributes } from 'react';

const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

const variantStyles: Record<string, string> = {
    default: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 shadow-sm',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
    outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-sm',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600 shadow-sm',
};

const sizeStyles: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
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
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
