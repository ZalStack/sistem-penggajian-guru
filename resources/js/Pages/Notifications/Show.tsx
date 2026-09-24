import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/ui/badge';
import { Icon } from '@iconify/react';

interface Notification {
    id: number;
    judul: string;
    pesan: string;
    tipe: 'info' | 'success' | 'warning' | 'error';
    kategori: 'sistem' | 'absensi' | 'perizinan' | 'gaji' | 'sesi';
    dibaca: boolean;
    dibaca_pada: string | null;
    created_at: string;
}

interface Props {
    notification: Notification;
}

const tipeIcon: Record<string, string> = {
    info: 'lucide:info',
    success: 'lucide:check-circle',
    warning: 'lucide:alert-triangle',
    error: 'lucide:x-circle',
};

const tipeColor: Record<string, string> = {
    info: 'text-sky-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-rose-600',
};

const tipeBadge: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger',
};

const kategoriLabel: Record<string, string> = {
    sistem: 'Sistem',
    absensi: 'Absensi',
    perizinan: 'Perizinan',
    gaji: 'Gaji',
    sesi: 'Sesi',
};

const kategoriIcon: Record<string, string> = {
    sistem: 'lucide:settings',
    absensi: 'lucide:clipboard-check',
    perizinan: 'lucide:shield-check',
    gaji: 'lucide:banknote',
    sesi: 'lucide:book-open',
};

export default function NotificationsShow({ notification }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('notifications.index')}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" className="text-sm" />
                    </Link>
                    <div>
                        <h2 className="page-title text-xl font-bold text-slate-900">Detail Notifikasi</h2>
                        <p className="page-subtitle text-xs text-slate-500 mt-0.5">Informasi notifikasi lengkap</p>
                    </div>
                </div>
            }
        >
            <Head title="Detail Notifikasi" />

            <div className="w-full mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-fade-in rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className={`px-6 py-5 border-b border-slate-100 ${
                        notification.tipe === 'info' ? 'bg-sky-50/50' :
                        notification.tipe === 'success' ? 'bg-emerald-50/50' :
                        notification.tipe === 'warning' ? 'bg-amber-50/50' :
                        'bg-rose-50/50'
                    }`}>
                        <div className="flex items-start gap-4">
                            <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs ${tipeColor[notification.tipe]}`}>
                                <Icon icon={tipeIcon[notification.tipe]} className="text-lg" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-lg font-bold text-slate-900">{notification.judul}</h1>
                                    <Badge variant={tipeBadge[notification.tipe]}>
                                        {notification.tipe}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                        <Icon icon={kategoriIcon[notification.kategori]} className="text-sm" />
                                        {kategoriLabel[notification.kategori]}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(notification.created_at).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        <div className="prose prose-sm max-w-none">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {notification.pesan}
                            </p>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                {notification.dibaca ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Icon icon="lucide:check-circle" className="text-sm text-emerald-500" />
                                        Dibaca pada {new Date(notification.dibaca_pada!).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1">
                                        <Icon icon="lucide:circle" className="text-sm text-slate-400" />
                                        Belum dibaca
                                    </span>
                                )}
                            </div>
                            <Link
                                href={route('notifications.index')}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                Kembali ke daftar
                                <Icon icon="lucide:arrow-right" className="text-sm" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
