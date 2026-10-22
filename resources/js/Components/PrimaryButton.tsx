import { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    children?: ReactNode;
}

export default function PrimaryButton({ className = '', disabled, children, ...props }: PrimaryButtonProps) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-xl border border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_6px_16px_-8px_rgba(79,70,229,0.7)] transition duration-150 ease-in-out hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
