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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="page-title">Riwayat Absensi</h1>
                    <p className="page-subtitle">
                        Pantau kehadiran Anda selama mengajar
                    </p>
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
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-3">
                        <Icon icon="lucide:calendar" className="text-slate-400 text-base" />
                        <label className="text-sm font-medium text-slate-700">Filter Bulan</label>
                        <input
                            type="month"
                            value={filters.bulan || ''}
                            onChange={(e) => handleFilterBulan(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
                        />
                    </div>
                    {filters.bulan && (
                        <button
                            type="button"
                            onClick={() => handleFilterBulan('')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
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
                                            <TableCell className="font-medium text-slate-400">
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
                                                <span className="text-sm text-slate-600">
                                                    {formatTime(att.checkin_time)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">
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
                                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">
                                                {new Date(att.tanggal).toLocaleDateString('id-ID', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {att.session?.jam_mulai} - {att.session?.jam_selesai}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400">Lokasi</p>
                                            <p className="text-slate-700">{att.session?.location?.nama_lokasi || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Durasi</p>
                                            <p className="text-slate-700">{att.durasi > 0 ? formatDuration(att.durasi) : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Check-in</p>
                                            <p className="text-slate-700">{formatTime(att.checkin_time)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Check-out</p>
                                            <p className="text-slate-700">{formatTime(att.checkout_time)}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <Badge variant={statusConfig[att.status]?.variant || 'default'}>
                                            {statusConfig[att.status]?.label || att.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Icon icon="lucide:clipboard-check" className="text-3xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Belum ada data absensi</h3>
                        <p className="text-sm text-slate-500 mt-1 w-full mx-auto">
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
