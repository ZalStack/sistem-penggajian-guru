import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{tsx,ts,jsx,js}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'Inter', ...defaultTheme.fontFamily.sans],
                display: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
                mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
            },
            fontSize: {
                '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
            },
            letterSpacing: {
                tighter: '-0.03em',
                tight: '-0.02em',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'soft': '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
                'card': '0 4px 12px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.06)',
                'elevated': '0 12px 24px rgba(15,23,42,0.06), 0 4px 8px rgba(15,23,42,0.04)',
                'float': '0 20px 40px rgba(15,23,42,0.08), 0 8px 16px rgba(15,23,42,0.04)',
                'glow': '0 0 20px rgba(15,23,42,0.06)',
                'inner': 'inset 0 1px 2px rgba(15,23,42,0.06)',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
                'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
                'scale-in': 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
            },
            colors: {
                // Unified palette — single source of truth
                background: '#f8fafc',
                surface: '#ffffff',
                border: '#e2e8f0',
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                // Brand accent — the #1e4db7 blue from Laporan reference
                accent: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    500: '#3b82f6',
                    600: '#1e4db7',
                    700: '#1a3fa0',
                    900: '#1e3a8a',
                },
                success: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                },
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    500: '#f59e0b',
                    600: '#d97706',
                },
                danger: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                },
            },
        },
    },

    plugins: [forms],
};
