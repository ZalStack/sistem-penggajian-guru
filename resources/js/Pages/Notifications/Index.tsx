import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
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

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    notifications: PaginatedData<Notification>;
    unreadCount: number;
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

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMenit = Math.floor(diffMs / 60000);
    const diffJam = Math.floor(diffMs / 3600000);
    const diffHari = Math.floor(diffMs / 86400000);

    if (diffMenit < 1) return 'Baru saja';
    if (diffMenit < 60) return `${diffMenit} menit lalu`;
    if (diffJam < 24) return `${diffJam} jam lalu`;
    if (diffHari < 7) return `${diffHari} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsIndex({ notifications, unreadCount }: Props) {
    const handleMarkAllRead = () => {
        router.post(route('notifications.markAllRead'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="page-title text-xl font-bold text-slate-900">Notifikasi</h2>
                        <p className="page-subtitle text-xs text-slate-500 mt-0.5">Pusat notifikasi dan informasi sistem</p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Icon icon="lucide:check-check" className="text-sm" />
                            Tandai semua sudah dibaca
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Notifikasi" />

            <div className="w-full mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-fade-in grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
                                <Icon icon="lucide:bell" className="text-sm text-slate-600" />
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wide">Total</span>
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{notifications.total}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100">
                                <Icon icon="lucide:mail" className="text-sm text-rose-600" />
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wide">Belum Dibaca</span>
                        </div>
                        <p className="text-2xl font-extrabold text-rose-600">{unreadCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
                                <Icon icon="lucide:check-circle" className="text-sm text-emerald-600" />
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wide">Dibaca</span>
                        </div>
                        <p className="text-2xl font-extrabold text-emerald-600">{notifications.total - unreadCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100">
                                <Icon icon="lucide:filter" className="text-sm text-sky-600" />
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wide">Halaman</span>
                        </div>
                        <p className="text-2xl font-extrabold text-sky-600">{notifications.current_page}/{notifications.last_page}</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    {notifications.data.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Icon icon="lucide:inbox" className="text-3xl text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mb-1">Tidak ada notifikasi</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Semua notifikasi sudah dibaca atau belum ada notifikasi baru.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.data.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={route('notifications.show', notif.id)}
                                    className={`flex items-start gap-3.5 p-5 transition-colors ${
                                        notif.dibaca
                                            ? 'bg-white hover:bg-slate-50'
                                            : 'bg-sky-50/30 hover:bg-sky-50/60'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs ${tipeColor[notif.tipe]}`}>
                                            <Icon icon={tipeIcon[notif.tipe]} className="text-sm" />
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <h3 className={`text-sm font-semibold truncate ${notif.dibaca ? 'text-slate-600' : 'text-slate-900'}`}>
                                                    {notif.judul}
                                                </h3>
                                                {!notif.dibaca && (
                                                    <span className="inline-block w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <Badge variant={tipeBadge[notif.tipe]} className="text-[10px] flex-shrink-0">
                                                {notif.tipe}
                                            </Badge>
                                        </div>
                                        <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${notif.dibaca ? 'text-slate-500' : 'text-slate-600'}`}>
                                            {notif.pesan}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                                                {kategoriLabel[notif.kategori]}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {formatRelativeTime(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {notifications.last_page > 1 && (
                        <div className="border-t border-slate-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Menampilkan {notifications.from}-{notifications.to} dari {notifications.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    {notifications.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
