import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import Pagination from '@/Components/ui/pagination';
import Select from '@/Components/ui/select';
import { Head, router, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Attendance, Guru, Grade, PaginatedData } from '@/types';

interface AttendanceRecap {
    total: number;
    valid: number;
    belum_checkin: number;
    belum_checkout: number;
    tidak_valid: number;
    izin: number;
    menunggu: number;
    total_jam: number;
    guru_hadir: number;
}

interface AttendanceIndexProps {
    attendances: PaginatedData<Attendance>;
    gurus: (Guru & { grade?: Grade })[];
    filters: {
        periode?: string;
        filter_guru?: string;
        filter_status?: string;
        filter_source?: string;
        tanggal?: string;
    };
    recap: AttendanceRecap;
    guruTerpilih: (Guru & { grade?: Grade }) | null;
}

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} menit`;
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
}

function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDisplayTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.substring(0, 5);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status: Attendance['status']) {
    switch (status) {
        case 'valid':
            return <Badge variant="success">Valid</Badge>;
        case 'tidak_valid':
            return <Badge variant="danger">Tidak Valid</Badge>;
        case 'belum_checkout':
            return <Badge variant="warning">Belum Checkout</Badge>;
        case 'belum_checkin':
            return <Badge variant="default">Belum Check-in</Badge>;
        case 'izin':
            return <Badge variant="info">Izin Disetujui</Badge>;
        case 'menunggu':
            return <Badge variant="warning">Menunggu Presensi</Badge>;
        default:
            return <Badge variant="default">{status}</Badge>;
    }
}

export default function AttendanceIndex({ attendances, gurus, filters, recap }: AttendanceIndexProps) {
    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('attendance.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const attendanceList = attendances.data;

    return (
        <AuthenticatedLayout>
            <Head title="Rekap Absensi" />

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Rekap Absensi</h1>
                    <p className="page-subtitle">
                        Pantau dan kelola data kehadiran guru seluruh sesi mengajar
                    </p>
                </div>
                <Link
                    href={route('penggajian.index')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)] hover:shadow-[0_10px_22px_-6px_rgba(124,58,237,0.65)] hover:-translate-y-[1px] shrink-0"
                >
                    <Icon icon="lucide:banknote" className="text-base" />
                    Hitung Gaji
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 animate-fade-in">
                <StatCard
                    title="Hadir Valid"
                    value={recap.valid}
                    icon="lucide:check-circle"
                    color="success"
                    description={`${recap.guru_hadir} guru hadir`}
                />
                <StatCard
                    title="Belum Check-in"
                    value={recap.belum_checkin}
                    icon="lucide:user-x"
                    color="warning"
                    description="Waktu sesi sudah lewat"
                />
                <StatCard
                    title="Belum Check-out"
                    value={recap.belum_checkout}
                    icon="lucide:log-out"
                    color="accent"
                    description="Check-in tanpa check-out"
                />
                <StatCard
                    title="Izin Disetujui"
                    value={recap.izin ?? 0}
                    icon="lucide:shield-check"
                    color="neutral"
                    description="Sesi tertutup perizinan"
                />
                <StatCard
                    title="Menunggu Presensi"
                    value={recap.menunggu ?? 0}
                    icon="lucide:hourglass"
                    color="slate"
                    description="Sesi belum dimulai"
                />
                <StatCard
                    title="Total Jam Mengajar"
                    value={`${recap.total_jam} jam`}
                    icon="lucide:clock"
                    color="slate"
                    description="Dari presensi valid"
                />
            </div>

            <Card
                title="Filter Presensi"
                description="Saring data kehadiran sesuai kebutuhan"
                className="mt-8"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Input
                        label="Periode"
                        type="month"
                        value={filters.periode ?? ''}
                        onChange={(e) => handleFilterChange('periode', e.target.value)}
                    />
                    <Input
                        label="Tanggal"
                        type="date"
                        value={filters.tanggal ?? ''}
                        onChange={(e) => handleFilterChange('tanggal', e.target.value)}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">Guru</label>
                        <select
                            value={filters.filter_guru ?? ''}
                            onChange={(e) => handleFilterChange('filter_guru', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors duration-200 shadow-sm cursor-pointer"
                        >
                            <option value="">Semua Guru</option>
                            {gurus.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Select
                        label="Status"
                        value={filters.filter_status ?? ''}
                        onChange={(e) => handleFilterChange('filter_status', e.target.value)}
                        options={[
                            { value: 'valid', label: 'Valid' },
                            { value: 'belum_checkin', label: 'Belum Check-in' },
                            { value: 'belum_checkout', label: 'Belum Check-out' },
                            { value: 'izin', label: 'Izin Disetujui' },
                            { value: 'menunggu', label: 'Menunggu Presensi' },
                            { value: 'tidak_valid', label: 'Tidak Valid' },
                        ]}
                        placeholder="Semua Status"
                    />
                    <Select
                        label="Sumber"
                        value={filters.filter_source ?? ''}
                        onChange={(e) => handleFilterChange('filter_source', e.target.value)}
                        options={[
                            { value: 'adik', label: 'SI ADIK-KK (GPS)' },
                            { value: 'siguru', label: 'SiGuru (Langsung)' },
                        ]}
                        placeholder="Semua Sumber"
                    />
                    <div className="flex items-end">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                router.get(
                                    route('attendance.index'),
                                    {},
                                    { preserveState: true, replace: true }
                                );
                            }}
                        >
                            <Icon icon="lucide:rotate-ccw" className="text-base" />
                            Reset Filter
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="mt-8">
                <Card
                    title="Daftar Absensi"
                    description={`Menampilkan ${attendances.total} baris presensi — termasuk sesi yang belum check-in`}
                >
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">No</TableHead>
                                    <TableHead>Guru</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Sesi</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Check-in</TableHead>
                                    <TableHead>Check-out</TableHead>
                                    <TableHead>Akurasi</TableHead>
                                    <TableHead>Durasi</TableHead>
                                    <TableHead>Sumber</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12}>
                                            <div className="text-center py-16">
                                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]">
                                                    <Icon icon="lucide:inbox" className="text-3xl" />
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Tidak ada data absensi ditemukan
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendanceList.map((att, index) => (
                                        <TableRow key={att.id}>
                                            <TableCell className="font-medium text-slate-500">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.6)]">
                                                        <Icon icon="lucide:user" className="text-base" />
                                                    </div>
                                                    <span className="font-medium text-slate-900">
                                                        {att.guru?.nama ?? '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="info">
                                                    {att.guru?.grade?.kode_grade ?? '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-slate-700 text-sm">{formatDisplayDate(att.tanggal)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-medium text-slate-600 block">
                                                    {att.session
                                                        ? `${att.session.jam_mulai?.substring(0,5)} – ${att.session.jam_selesai?.substring(0,5)}`
                                                        : '-'}
                                                </span>
                                                <span className="text-[10.5px] text-slate-400">
                                                    {att.session?.program?.nama ?? att.session?.mapel ?? ''}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-slate-600 text-sm truncate max-w-[160px] block">{att.session?.location?.nama_lokasi ?? '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium text-xs text-slate-700">
                                                        {formatDisplayTime(att.checkin_time)}
                                                    </span>
                                                    {att.checkin_accuracy != null && (
                                                        <p className="text-[10px] text-slate-400">±{Math.round(att.checkin_accuracy)}m</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium text-xs text-slate-700">
                                                        {formatDisplayTime(att.checkout_time)}
                                                    </span>
                                                    {att.checkout_accuracy != null && (
                                                        <p className="text-[10px] text-slate-400">±{Math.round(att.checkout_accuracy)}m</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-slate-600">
                                                    {att.checkin_accuracy != null && att.checkout_accuracy != null
                                                        ? `±${Math.round((att.checkin_accuracy + att.checkout_accuracy) / 2)}m`
                                                        : att.checkin_accuracy != null
                                                            ? `±${Math.round(att.checkin_accuracy)}m`
                                                            : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium text-slate-700">
                                                    {att.durasi > 0 ? formatDuration(att.durasi) : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${(att as any).source === 'adik' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                    {(att as any).source === 'adik' ? 'SI ADIK-KK' : 'SiGuru'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(att.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                        {attendanceList.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]">
                                    <Icon icon="lucide:inbox" className="text-3xl" />
                                </div>
                                <p className="text-sm text-slate-500">Tidak ada data absensi ditemukan</p>
                            </div>
                        ) : (
                            attendanceList.map((att, index) => (
                                <div
                                    key={att.id}
                                    className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 shadow-sm transition-colors space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.6)]">
                                                <Icon icon="lucide:user" className="text-base" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">
                                                    {att.guru?.nama ?? '-'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Grade {att.guru?.grade?.kode_grade ?? '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500">
                                                #{index + 1}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${(att as any).source === 'adik' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {(att as any).source === 'adik' ? 'SI ADIK-KK' : 'SiGuru'}
                                            </span>
                                            {getStatusBadge(att.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-slate-500">Tanggal</p>
                                            <p className="font-medium text-slate-700">{att.tanggal}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Sesi</p>
                                            <p className="font-medium text-slate-700 font-mono">
                                                {att.session
                                                    ? `${att.session.jam_mulai} - ${att.session.jam_selesai}`
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Lokasi</p>
                                            <p className="font-medium text-slate-700">
                                                {att.session?.location?.nama_lokasi ?? '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Durasi</p>
                                            <p className="font-medium text-slate-700">
                                                {att.durasi > 0 ? formatDuration(att.durasi) : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Check-in</p>
                                            <p className="font-medium text-slate-700 font-mono">
                                                {att.checkin_time ?? '-'}
                                            </p>
                                            {att.checkin_accuracy != null && (
                                                <p className="text-[10px] text-slate-400">±{Math.round(att.checkin_accuracy)}m</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Check-out</p>
                                            <p className="font-medium text-slate-700 font-mono">
                                                {att.checkout_time ?? '-'}
                                            </p>
                                            {att.checkout_accuracy != null && (
                                                <p className="text-[10px] text-slate-400">±{Math.round(att.checkout_accuracy)}m</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {attendances.links && <Pagination links={attendances.links} />}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
