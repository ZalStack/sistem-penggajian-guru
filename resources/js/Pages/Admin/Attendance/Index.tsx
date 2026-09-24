import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import Pagination from '@/Components/ui/pagination';
import { Head, router, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Attendance, Guru, Grade, PaginatedData } from '@/types';

interface AttendanceIndexProps {
    attendances: PaginatedData<Attendance>;
    gurus: (Guru & { grade?: Grade })[];
    filters: {
        periode?: string;
        filter_guru?: string;
    };
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
        default:
            return <Badge variant="default">{status}</Badge>;
    }
}

export default function AttendanceIndex({ attendances, gurus, filters }: AttendanceIndexProps) {
    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('attendance.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const attendanceList = attendances.data;
    const totalHadir = attendanceList.filter((a) => a.status === 'valid').length;
    const totalTidakHadir = attendanceList.filter(
        (a) => a.status === 'belum_checkin' || a.status === 'belum_checkout'
    ).length;
    const validAttendances = attendanceList.filter((a) => a.status === 'valid');
    const avgDuration =
        validAttendances.length > 0
            ? Math.round(validAttendances.reduce((sum, a) => sum + a.durasi, 0) / validAttendances.length)
            : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Rekap Absensi" />

            <div className="page-header animate-fade-in flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="min-w-0">
                    <h1 className="page-title">Rekap Absensi</h1>
                    <p className="page-subtitle">
                        Pantau dan kelola data kehadiran guru seluruh sesi mengajar
                    </p>
                </div>
                <Link
                    href={route('salary.index')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm shrink-0"
                >
                    <Icon icon="lucide:banknote" className="text-base" />
                    Hitung Gaji
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
                <StatCard
                    title="Total Hadir"
                    value={totalHadir}
                    icon="lucide:check-circle"
                    color="success"
                    description="Absensi valid"
                />
                <StatCard
                    title="Total Belum Hadir"
                    value={totalTidakHadir}
                    icon="lucide:x-circle"
                    color="danger"
                    description="Check-in/checkout tertinggal"
                />
                <StatCard
                    title="Rata-rata Durasi"
                    value={formatDuration(avgDuration)}
                    icon="lucide:clock"
                    color="accent"
                    description="Dari yang hadir"
                />
            </div>

            <Card
                title="Filter Periode"
                description="Gunakan filter untuk menampilkan data sesuai kebutuhan"
                className="mt-8"
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Input
                        label="Periode"
                        type="month"
                        value={filters.periode ?? ''}
                        onChange={(e) => handleFilterChange('periode', e.target.value)}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">Guru</label>
                        <select
                            value={filters.filter_guru ?? ''}
                            onChange={(e) => handleFilterChange('filter_guru', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors duration-200 shadow-sm cursor-pointer"
                        >
                            <option value="">Semua Guru</option>
                            {gurus.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.nama}
                                </option>
                            ))}
                        </select>
                    </div>
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
                    description={`Menampilkan ${attendances.total} data kehadiran`}
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
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11}>
                                            <div className="text-center py-16">
                                                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
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
                                            <TableCell className="font-medium text-slate-400">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
                                                <span className="text-xs font-medium text-slate-600">
                                                    {att.session
                                                        ? `${att.session.jam_mulai?.substring(0,5)} – ${att.session.jam_selesai?.substring(0,5)}`
                                                        : '-'}
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
                                                    {formatDuration(att.durasi)}
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
                                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Icon icon="lucide:inbox" className="text-3xl" />
                                </div>
                                <p className="text-sm text-slate-500">Tidak ada data absensi ditemukan</p>
                            </div>
                        ) : (
                            attendanceList.map((att, index) => (
                                <div
                                    key={att.id}
                                    className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Icon icon="lucide:user" className="text-base" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">
                                                    {att.guru?.nama ?? '-'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Grade {att.guru?.grade?.kode_grade ?? '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-400">
                                                #{index + 1}
                                            </span>
                                            {getStatusBadge(att.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-slate-400">Tanggal</p>
                                            <p className="font-medium text-slate-700">{att.tanggal}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Sesi</p>
                                            <p className="font-medium text-slate-700 font-mono">
                                                {att.session
                                                    ? `${att.session.jam_mulai} - ${att.session.jam_selesai}`
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Lokasi</p>
                                            <p className="font-medium text-slate-700">
                                                {att.session?.location?.nama_lokasi ?? '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Durasi</p>
                                            <p className="font-medium text-slate-700">
                                                {formatDuration(att.durasi)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Check-in</p>
                                            <p className="font-medium text-slate-700 font-mono">
                                                {att.checkin_time ?? '-'}
                                            </p>
                                            {att.checkin_accuracy != null && (
                                                <p className="text-[10px] text-slate-400">±{Math.round(att.checkin_accuracy)}m</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Check-out</p>
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
