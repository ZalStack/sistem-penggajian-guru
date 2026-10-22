import { ButtonHTMLAttributes, ReactNode } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    children?: ReactNode;
}

export default function SecondaryButton({ type = 'button', className = '', disabled, children, ...props }: SecondaryButtonProps) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-700 shadow-sm transition duration-150 ease-in-out hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
