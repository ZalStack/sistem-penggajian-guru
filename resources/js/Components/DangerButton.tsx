import { ButtonHTMLAttributes, ReactNode } from 'react';

interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    children?: ReactNode;
}

export default function DangerButton({ className = '', disabled, children, ...props }: DangerButtonProps) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-xl border border-transparent bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_6px_16px_-8px_rgba(225,29,72,0.7)] transition duration-150 ease-in-out hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 active:scale-[0.98] ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
