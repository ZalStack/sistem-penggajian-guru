import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/ui/badge';
import Button from '@/Components/ui/button';
import StatCard from '@/Components/ui/stat-card';
import EmptyState from '@/Components/ui/empty-state';
import Pagination from '@/Components/ui/pagination';
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
    info: 'tabler:info-circle',
    success: 'tabler:circle-check',
    warning: 'tabler:alert-triangle',
    error: 'tabler:circle-x',
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

const tipeLabel: Record<string, string> = {
    info: 'Informasi',
    success: 'Sukses',
    warning: 'Peringatan',
    error: 'Penting',
};

const kategoriLabel: Record<string, string> = {
    sistem: 'Sistem',
    absensi: 'Absensi',
    perizinan: 'Perizinan',
    gaji: 'Gaji',
    sesi: 'Sesi',
    sunnah: '7SPS',
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
        router.post(route('notifications.markAllRead'), {}, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notifikasi" />

            <div className="w-full mx-auto">
                <div className="animate-fade-in page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="page-title">Notifikasi</h1>
                        <p className="page-subtitle">Pusat notifikasi dan informasi sistem</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="secondary"
                            onClick={handleMarkAllRead}
                            className="w-full sm:w-auto"
                        >
                            <Icon icon="tabler:checks" className="text-sm" />
                            Tandai semua sudah dibaca
                        </Button>
                    )}
                </div>

                <div className="animate-fade-in grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <StatCard
                        title="Total Notifikasi"
                        value={notifications.total}
                        icon="tabler:bell"
                        color="accent"
                        description="Semua pemberitahuan sistem"
                    />
                    <StatCard
                        title="Belum Dibaca"
                        value={unreadCount}
                        icon="tabler:mail"
                        color="danger"
                        description="Pemberitahuan yang butuh perhatian"
                    />
                    <StatCard
                        title="Sudah Dibaca"
                        value={notifications.total - unreadCount}
                        icon="tabler:circle-check"
                        color="success"
                        description="Arsip riwayat terbaca"
                    />
                </div>

                <div className="card-modern overflow-hidden">
                    {notifications.data.length === 0 ? (
                        <EmptyState
                            icon="tabler:inbox"
                            title="Tidak ada notifikasi"
                            description="Semua notifikasi sudah dibaca atau belum ada notifikasi baru."
                        />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.data.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={route('notifications.show', notif.id)}
                                    className={`flex items-start gap-3.5 p-5 transition-colors ${
                                        notif.dibaca
                                            ? 'bg-white hover:bg-indigo-50/40'
                                            : 'bg-indigo-50/60 hover:bg-indigo-50/90 border-indigo-100 shadow-[inset_3px_0_0_0_rgba(99,102,241,0.8)]'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border shadow-xs ${notif.dibaca ? 'border-slate-200' : 'border-indigo-200'} ${tipeColor[notif.tipe]}`}>
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
                                                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <Badge variant={tipeBadge[notif.tipe]} size="sm" className="flex-shrink-0">
                                                {tipeLabel[notif.tipe] || notif.tipe}
                                            </Badge>
                                        </div>
                                        <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${notif.dibaca ? 'text-slate-500' : 'text-slate-600'}`}>
                                            {notif.pesan}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                                {kategoriLabel[notif.kategori]}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatRelativeTime(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {notifications.last_page > 1 && (
                        <div className="px-5 pb-5">
                            <Pagination
                                links={notifications.links}
                                from={notifications.from ?? undefined}
                                to={notifications.to ?? undefined}
                                total={notifications.total}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
