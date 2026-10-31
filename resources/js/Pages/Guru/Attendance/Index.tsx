import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Attendance, Guru } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AttendanceIndexProps {
    attendances: Attendance[];
    totalHadir: number;
    totalJam: number;
    guru: Guru;
    filters: { bulan?: string };
    upcomingSessions?: any[];
    todayAttendances?: Record<string, any>;
    izinHariIni?: { jenis: string; rentang: string; alasan?: string } | null;
    stats?: {
        total_sesi_bulan: number;
        total_hadir: number;
        gaji_bulan: number;
        potensi_gaji: number;
        status_bayar: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
    valid: { label: 'Valid', variant: 'success' },
    tidak_valid: { label: 'Tidak Valid', variant: 'danger' },
    belum_checkout: { label: 'Belum Checkout', variant: 'warning' },
    belum_checkin: { label: 'Belum Check-in', variant: 'default' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

function upcomingDateLabel(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(`${dateStr}T00:00:00`);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Hari Ini';
    if (diff === 1) return 'Besok';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function UpcomingSessionCard({ session }: { session: any }) {
    return (
        <div className="p-4 bg-white rounded-2xl border border-dashed border-indigo-200/80 hover:border-indigo-300 transition-all duration-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon icon="lucide:calendar-clock" className="text-indigo-500 text-sm" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 break-words">{session.location?.nama_lokasi}</p>
                        <p className="text-xs text-slate-500 mt-0.5 break-words">
                            {session.jam_mulai?.substring(0, 5)} - {session.jam_selesai?.substring(0, 5)} &bull; {session.program ?? session.mapel} &bull; {session.jumlah_sesi} sesi
                        </p>
                        {session.transport && (
                            <p className="text-xs text-slate-500 mt-0.5 break-words">Transport: {session.transport.jenis}</p>
                        )}
                    </div>
                </div>
                <Badge variant="info" size="sm">{upcomingDateLabel(session.tanggal)}</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Icon icon="lucide:map-pin-check" className="text-[11px] shrink-0" /> Presensi dilakukan di aplikasi SI ADIK-KK sesuai ploting sesi admin.
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component — riwayat read-only, presensi pindah ke SI ADIK-KK
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendanceIndex({
    attendances,
    totalHadir,
    totalJam,
    guru,
    filters,
    upcomingSessions = [],
    izinHariIni = null,
    stats,
}: AttendanceIndexProps) {
    const handleFilterBulan = (value: string) => {
        router.get(
            route('my-attendance'),
            { bulan: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Kehadiran" />

            {/* Hero header */}
            <div className="bg-gradient-to-b from-indigo-600 to-violet-600 text-white rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-start gap-4 sm:items-center sm:flex-row-reverse">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-xl">
                            <Icon icon="lucide:clipboard-check" className="text-2xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Riwayat Kehadiran</h1>
                            <p className="text-sm sm:text-base font-medium text-indigo-200/80 uppercase tracking-wider">Kehadiran mengajar dari sinkronisasi SI ADIK-KK</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner: presensi di SI ADIK-KK */}
            <div className="mb-8 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(14,165,233,0.7)]">
                        <Icon icon="lucide:map-pin-check" className="text-base" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                            Presensi check-in/check-out dilakukan di aplikasi SI ADIK-KK
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5 break-words leading-relaxed">
                            Halaman ini bersifat <strong>riwayat (read-only)</strong>. Presensi harian dilakukan melalui menu <strong>Absensi Guru</strong> di SI ADIK-KK berbasis geofence GPS, lalu otomatis tersinkron ke sini.
                        </p>
                    </div>
                </div>
                <a
                    href="/guru/siguru"
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                    <Icon icon="lucide:external-link" className="text-xs" /> Buka Absensi SI ADIK-KK
                </a>
            </div>

            {/* Izin aktif banner */}
            {izinHariIni && (
                <div className="mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 sm:p-5 flex items-start gap-3">
                    <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:shield-check" className="text-base" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                            {izinHariIni.jenis} disetujui &mdash; presensi tidak diperlukan
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5 break-words">
                            Periode {izinHariIni.rentang}. Sesi mengajar pada rentang ini tercatat sebagai Izin di rekap presensi.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <StatCard
                    title="Total Hadir"
                    value={`${totalHadir} kali`}
                    icon="lucide:check-circle"
                    color="success"
                    description="Kehadiran valid terverifikasi geofence GPS"
                />
                <StatCard
                    title="Total Jam Mengajar"
                    value={formatDuration(totalJam)}
                    icon="lucide:clock"
                    color="indigo"
                    description="Total waktu mengajar tercatat"
                />
            </div>

            {/* Filter */}
            <Card className="mb-8">
                <div className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200/70">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md">
                                <Icon icon="lucide:calendar" className="text-sm" />
                            </span>
                            <div>
                                <span className="text-sm font-semibold text-slate-700">Filter Bulan</span>
                                <p className="text-xs text-slate-500 mt-0.5">Pilih bulan untuk melihat riwayat kehadiran</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="month"
                                value={filters.bulan || ''}
                                onChange={(e) => handleFilterBulan(e.target.value)}
                                className="input-modern w-full sm:w-auto sm:min-w-[180px]"
                            />
                            {filters.bulan && (
                                <button
                                    type="button"
                                    onClick={() => handleFilterBulan('')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 rounded-xl transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                                >
                                    <Icon icon="lucide:rotate-ccw" /> Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Jadwal Mengajar Terdekat */}
            <Card className="mb-8">
                <div className="p-6 sm:p-7 bg-white rounded-2xl border border-indigo-100/50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Jadwal Mengajar Terdekat</h2>
                            <p className="text-sm text-indigo-500 mt-1">Presensi dilakukan di SI ADIK-KK sesuai ploting sesi admin</p>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-500 border-b-2 border-indigo-500 px-2 py-1 rounded">
                            {upcomingSessions.length} sesi
                        </span>
                    </div>
                    {upcomingSessions.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {upcomingSessions.map((session: any) => (
                                <UpcomingSessionCard key={session.id} session={session} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                                <Icon icon="lucide:calendar-off" className="text-[28px] text-indigo-400" />
                            </div>
                            <p className="text-[13px] font-medium text-slate-700">Jadwal Mengajar</p>
                            <p className="text-[12px] text-slate-500">Tidak ada jadwal mendatang. Lihat jadwal mingguan di menu Jadwal.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Ringkasan Pembayaran */}
            {stats && (
                <Card className="mb-8">
                    <div className="p-6 sm:p-7 bg-white rounded-2xl border border-indigo-100/50">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Ringkasan Pembayaran</h2>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-indigo-500">Gaji Bulan Ini</p>
                                <p className="text-[20px] sm:text-[22px] font-[800] tracking-tight text-slate-900 mt-1 break-words">{formatCurrency(stats.gaji_bulan ?? 0)}</p>
                            </div>
                            <div className="sm:pt-1 sm:text-right">
                                <p className="text-[10px] font-bold tracking-[0.06em] uppercase text-indigo-400">Potensi Gaji Bulan Ini</p>
                                <p className="text-[16px] font-[800] tracking-[-0.02em] text-slate-900 mt-1 break-words">{formatCurrency(stats.potensi_gaji ?? 0)}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-indigo-100/30">
                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                                <span>Status: {stats.status_bayar === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Menunggu Pembayaran'}</span>
                                <span className={`w-2 h-2 rounded-full ${stats.status_bayar === 'sudah_dibayar' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            </div>
                            <div className="mt-4 h-2 rounded-full bg-indigo-100/80 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(100, ((stats.total_hadir ?? 0) / Math.max(1, stats.total_sesi_bulan ?? 1)) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2">
                                {stats.total_hadir ?? 0} dari {stats.total_sesi_bulan ?? 0} sesi hadir
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Table riwayat absensi */}
            <Card>
                {attendances.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <div className="overflow-x-auto">
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
                                            <TableHead>Sumber</TableHead>
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
                                                <TableCell>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${(att as any).source === 'adik' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                        {(att as any).source === 'adik' ? 'SI ADIK-KK' : 'SiGuru'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {attendances.map((att, index) => (
                                <div
                                    key={att.id}
                                    className="rounded-2xl border border-indigo-100/50 bg-white p-5 shadow-[0_1px_3px_rgba(79,70,229,0.05)] hover:border-indigo-200 hover:shadow-[0_10px_24px_rgba(79,70,229,0.12)] transition-all"
                                >
                                    <div className="flex items-start justify-between gap-3">
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

                                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
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

                                    <div className="pt-4 border-t border-indigo-100/30 mt-3 flex items-center justify-between gap-2">
                                        <Badge variant={statusConfig[att.status]?.variant || 'default'}>
                                            {statusConfig[att.status]?.label || att.status}
                                        </Badge>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${(att as any).source === 'adik' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {(att as any).source === 'adik' ? 'SI ADIK-KK' : 'SiGuru'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 sm:py-24 px-4">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5 shadow-[0_12px_26px_-8px_rgba(99,102,241,0.5)]">
                            <Icon icon="lucide:clipboard-check" className="text-4xl text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Belum ada data absensi</h3>
                        <p className="text-sm text-slate-500 mt-2 mx-auto max-w-sm break-words">
                            {filters.bulan
                                ? 'Tidak ada data absensi untuk bulan yang dipilih.'
                                : 'Absen akan muncul di sini setelah dilakukan check-in melalui aplikasi SI ADIK-KK.'}
                        </p>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
