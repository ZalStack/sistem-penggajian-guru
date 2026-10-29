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
    kategori: 'sistem' | 'absensi' | 'perizinan' | 'gaji' | 'sesi' | 'sunnah';
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
    info: 'text-indigo-600',
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
    sunnah: '7SPS',
};

const kategoriIcon: Record<string, string> = {
    sistem: 'lucide:settings',
    absensi: 'lucide:clipboard-check',
    perizinan: 'lucide:shield-check',
    gaji: 'lucide:banknote',
    sesi: 'lucide:book-open',
    sunnah: 'lucide:moon-star',
};

export default function NotificationsShow({ notification }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Detail Notifikasi" />

            <div className="w-full mx-auto">
                <div className="animate-fade-in page-header flex items-center gap-3">
                    <Link
                        href={route('notifications.index')}
                        className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" className="text-base" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="page-title">Detail Notifikasi</h1>
                        <p className="page-subtitle">Informasi notifikasi lengkap</p>
                    </div>
                </div>

                <div className="animate-fade-in card-elevated overflow-hidden">
                    <div className={`px-5 sm:px-6 py-5 border-b border-indigo-100 ${
                        notification.tipe === 'info' ? 'bg-gradient-to-br from-indigo-100/70 to-violet-100/50' :
                        notification.tipe === 'success' ? 'bg-emerald-50/50' :
                        notification.tipe === 'warning' ? 'bg-amber-50/50' :
                        'bg-rose-50/50'
                    }`}>
                        <div className="flex items-start gap-4">
                            <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 shadow-xs ${tipeColor[notification.tipe]}`}>
                                <Icon icon={tipeIcon[notification.tipe]} className="text-lg" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h2 className="text-lg font-bold text-slate-900 break-words">{notification.judul}</h2>
                                    <Badge variant={tipeBadge[notification.tipe]}>
                                        {notification.tipe}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
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

                    <div className="px-5 sm:px-6 py-6">
                        <div className="prose prose-sm max-w-none">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                {notification.pesan}
                            </p>
                        </div>
                    </div>

                    <div className="px-5 sm:px-6 py-4 border-t border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                                        <Icon icon="lucide:circle" className="text-sm text-indigo-500" />
                                        Belum dibaca
                                    </span>
                                )}
                            </div>
                            <Link
                                href={route('notifications.index')}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
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
