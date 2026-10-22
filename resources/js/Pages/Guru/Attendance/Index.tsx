import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Attendance, Guru } from '@/types';

interface AttendanceIndexProps {
    attendances: Attendance[];
    totalHadir: number;
    totalJam: number;
    guru: Guru;
    filters: { bulan?: string };
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
    valid: { label: 'Valid', variant: 'success' },
    tidak_valid: { label: 'Tidak Valid', variant: 'danger' },
    belum_checkout: { label: 'Belum Checkout', variant: 'warning' },
    belum_checkin: { label: 'Belum Check-in', variant: 'default' },
};

function formatDuration(minutes: number): string {
    const jam = Math.floor(minutes / 60);
    const menit = minutes % 60;
    if (jam === 0) return `${menit} menit`;
    if (menit === 0) return `${jam} jam`;
    return `${jam} jam ${menit} menit`;
}

function formatTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceIndex({ attendances, totalHadir, totalJam, guru, filters }: AttendanceIndexProps) {
    const handleFilterBulan = (value: string) => {
        router.get(
            route('my-attendance'),
            { bulan: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Absensi" />

            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
                <div className="flex items-start gap-3.5 min-w-0">
                    <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:clipboard-check" className="text-xl" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="page-title">Riwayat Absensi</h1>
                        <p className="page-subtitle">
                            Pantau kehadiran Anda selama mengajar
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <StatCard
                    title="Total Hadir"
                    value={`${totalHadir} kali`}
                    icon="lucide:check-circle"
                    color="green"
                />
                <StatCard
                    title="Total Jam Mengajar"
                    value={formatDuration(totalJam)}
                    icon="lucide:clock"
                    color="blue"
                />
            </div>

            {/* Filter */}
            <Card className="mb-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                            <span className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.6)]">
                                <Icon icon="lucide:calendar" className="text-sm" />
                            </span>
                            Filter Bulan
                        </span>
                        <input
                            type="month"
                            value={filters.bulan || ''}
                            onChange={(e) => handleFilterBulan(e.target.value)}
                            className="input-modern w-full sm:w-auto sm:min-w-[200px]"
                        />
                    </div>
                    {filters.bulan && (
                        <button
                            type="button"
                            onClick={() => handleFilterBulan('')}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 rounded-xl transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-rose-500/25 sm:ml-auto"
                        >
                            <Icon icon="lucide:rotate-ccw" /> Reset
                        </button>
                    )}
                </div>
            </Card>

            {/* Table */}
            <Card>
                {attendances.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">No</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Sesi</TableHead>
                                        <TableHead>Lokasi</TableHead>
                                        <TableHead>Check-in</TableHead>
                                        <TableHead>Check-out</TableHead>
                                        <TableHead>Durasi</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendances.map((att, index) => (
                                        <TableRow key={att.id}>
                                            <TableCell className="font-semibold text-indigo-500">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-900">
                                                    {new Date(att.tanggal).toLocaleDateString('id-ID', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-700">
                                                    {att.session?.jam_mulai} - {att.session?.jam_selesai}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">
                                                    {att.session?.location?.nama_lokasi || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {formatTime(att.checkin_time)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                                    {formatTime(att.checkout_time)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">
                                                    {att.durasi > 0 ? formatDuration(att.durasi) : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[att.status]?.variant || 'default'}>
                                                    {statusConfig[att.status]?.label || att.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {attendances.map((att, index) => (
                                <div
                                    key={att.id}
                                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(79,70,229,0.05)] hover:border-indigo-200 hover:shadow-[0_10px_24px_rgba(79,70,229,0.12)] transition-all space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)]">
                                                <Icon icon="lucide:calendar-days" className="text-lg" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm break-words">
                                                    {new Date(att.tanggal).toLocaleDateString('id-ID', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                    <Icon icon="lucide:clock" className="text-indigo-500" />
                                                    <span className="break-words">
                                                        {att.session?.jam_mulai} - {att.session?.jam_selesai}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                                            #{index + 1}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500">Lokasi</p>
                                            <p className="text-slate-700 font-medium break-words">{att.session?.location?.nama_lokasi || '-'}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500">Durasi</p>
                                            <p className="text-slate-700 font-medium break-words">{att.durasi > 0 ? formatDuration(att.durasi) : '-'}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Check-in
                                            </p>
                                            <p className="text-slate-700 font-medium break-words">{formatTime(att.checkin_time)}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                                Check-out
                                            </p>
                                            <p className="text-slate-700 font-medium break-words">{formatTime(att.checkout_time)}</p>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-indigo-100/70">
                                        <Badge variant={statusConfig[att.status]?.variant || 'default'}>
                                            {statusConfig[att.status]?.label || att.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 sm:py-20 px-2">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto mb-4 shadow-[0_12px_26px_-8px_rgba(99,102,241,0.7)]">
                            <Icon icon="lucide:clipboard-check" className="text-3xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Belum ada data absensi</h3>
                        <p className="text-sm text-slate-500 mt-1 mx-auto max-w-sm break-words">
                            {filters.bulan
                                ? 'Tidak ada data absensi untuk bulan yang dipilih.'
                                : 'Data absensi akan muncul setelah Anda melakukan check-in.'}
                        </p>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
