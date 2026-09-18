import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import { Head, router, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Attendance, Guru, Grade } from '@/types';

interface AttendanceIndexProps {
    attendances: Attendance[];
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

    const totalHadir = attendances.filter((a) => a.status === 'valid').length;
    const totalTidakHadir = attendances.filter(
        (a) => a.status === 'belum_checkin' || a.status === 'belum_checkout'
    ).length;
    const validAttendances = attendances.filter((a) => a.status === 'valid');
    const avgDuration =
        validAttendances.length > 0
            ? Math.round(validAttendances.reduce((sum, a) => sum + a.durasi, 0) / validAttendances.length)
            : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Rekap Absensi" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rekap Absensi</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pantau dan kelola data kehadiran guru seluruh sesi mengajar
                    </p>
                </div>
                <Link
                    href={route('salary.index')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                >
                    <Icon icon="lucide:banknote" className="text-base" />
                    Hitung Gaji
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="Total Hadir"
                    value={totalHadir}
                    icon="lucide:check-circle"
                    color="green"
                    description="Absensi valid"
                />
                <StatCard
                    title="Total Belum Hadir"
                    value={totalTidakHadir}
                    icon="lucide:x-circle"
                    color="red"
                    description="Check-in/checkout tertinggal"
                />
                <StatCard
                    title="Rata-rata Durasi"
                    value={formatDuration(avgDuration)}
                    icon="lucide:clock"
                    color="blue"
                    description="Dari yang hadir"
                />
            </div>

            <Card
                title="Filter Periode"
                description="Gunakan filter untuk menampilkan data sesuai kebutuhan"
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                        label="Periode"
                        type="month"
                        value={filters.periode ?? ''}
                        onChange={(e) => handleFilterChange('periode', e.target.value)}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Guru</label>
                        <select
                            value={filters.filter_guru ?? ''}
                            onChange={(e) => handleFilterChange('filter_guru', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors duration-200 shadow-sm cursor-pointer"
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

            <div className="mt-6">
                <Card
                    title="Daftar Absensi"
                    description={`Menampilkan ${attendances.length} data kehadiran`}
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
                                    <TableHead>Durasi</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10}>
                                            <div className="text-center py-12">
                                                <Icon
                                                    icon="lucide:inbox"
                                                    className="text-4xl text-slate-300 mx-auto mb-3"
                                                />
                                                <p className="text-sm text-slate-500">
                                                    Tidak ada data absensi ditemukan
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendances.map((att, index) => (
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
                                                <span className="text-slate-700">{att.tanggal}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono text-slate-600">
                                                    {att.session
                                                        ? `${att.session.jam_mulai} - ${att.session.jam_selesai}`
                                                        : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-slate-600">
                                                    {att.session?.location?.nama_lokasi ?? '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs text-slate-700">
                                                    {att.checkin_time ?? '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs text-slate-700">
                                                    {att.checkout_time ?? '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-700">
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
                        {attendances.length === 0 ? (
                            <div className="text-center py-12">
                                <Icon icon="lucide:inbox" className="text-4xl text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Tidak ada data absensi ditemukan</p>
                            </div>
                        ) : (
                            attendances.map((att, index) => (
                                <div
                                    key={att.id}
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
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

                                    <div className="grid grid-cols-2 gap-2 text-xs">
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
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Check-out</p>
                                            <p className="font-medium text-slate-700 font-mono">
                                                {att.checkout_time ?? '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
