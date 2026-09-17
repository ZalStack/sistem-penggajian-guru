import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

interface GuestLayoutProps {
    children: ReactNode;
}

export default function GuestLayout({ children }: GuestLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-4 shadow-lg">
                        <Icon icon="lucide:graduation-cap" className="text-white text-3xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">SIGURU</h1>
                    <p className="text-sm text-gray-500 mt-1">Sistem Informasi Penggajian Guru</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {children}
                </div>
                <p className="text-center text-xs text-gray-400 mt-6">&copy; {new Date().getFullYear()} SIGURU - KPM Pusat</p>
            </div>
        </div>
    );
}
