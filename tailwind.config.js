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
                'soft': '0 1px 3px rgba(79,70,229,0.05), 0 1px 2px rgba(15,23,42,0.04)',
                'card': '0 4px 14px rgba(79,70,229,0.07), 0 1px 3px rgba(15,23,42,0.05)',
                'elevated': '0 12px 28px rgba(79,70,229,0.10), 0 4px 8px rgba(15,23,42,0.04)',
                'float': '0 24px 48px -12px rgba(30,27,75,0.18), 0 8px 16px -8px rgba(15,23,42,0.08)',
                'glow': '0 0 24px rgba(124,58,237,0.18)',
                'brand': '0 8px 20px -6px rgba(79,70,229,0.45)',
                'brand-lg': '0 16px 34px -10px rgba(124,58,237,0.5)',
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
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%)',
                'brand-gradient-soft': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                'sidebar-gradient': 'linear-gradient(180deg, #111a3e 0%, #1b1650 55%, #241a5e 100%)',
                'hero-gradient': 'linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)',
            },
            colors: {
                // Unified palette — single source of truth
                background: '#f6f7fb',
                surface: '#ffffff',
                border: '#e6e8f2',
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
                // Brand — Indigo/Violet identity
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                violet: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                // Legacy accent — kept for backward compatibility
                accent: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    900: '#312e81',
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
