import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import EmptyState from '@/Components/ui/empty-state';
import Input from '@/Components/ui/input';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Penggajian, Guru, RiwayatMengajarMap } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { programStyle } from '@/lib/program-colors';

interface SalaryIndexProps {
    penggajians: Penggajian[];
    guru: Guru;
    totalGaji: number;
    totalBayar: number;
    gajiBulanIni: Penggajian | null;
    periodeDefault: string;
    periodeAktif: string;
    filters: { periode?: string };
    riwayatMengajar: RiwayatMengajarMap;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' }> = {
    belum_dibayar: { label: 'Belum Dibayar', variant: 'danger' },
    sudah_dibayar: { label: 'Sudah Dibayar', variant: 'success' },
};

const sesiStatusVariant: Record<string, 'info' | 'success' | 'danger' | 'warning' | 'default'> = {
    dijadwalkan: 'info',
    berlangsung: 'warning',
    selesai: 'success',
    dibatalkan: 'danger',
};

const sesiStatusLabel: Record<string, string> = {
    dijadwalkan: 'Dijadwalkan',
    berlangsung: 'Berlangsung',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
};

export default function SalaryIndex({ penggajians, guru, totalGaji, totalBayar, gajiBulanIni, periodeDefault, periodeAktif, filters, riwayatMengajar }: SalaryIndexProps) {
    const belumBayar = totalGaji - totalBayar;

    const periodeLabel = new Date(periodeAktif + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const riwayat = Object.values(riwayatMengajar ?? {})[0] ?? null;

    const handlePeriodeChange = (value: string) => {
        router.get(
            route('my-salary'),
            { periode: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Mengajar" />

            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
                <div className="flex items-start gap-3.5 min-w-0">
                    <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(99,102,241,0.7)]">
                        <Icon icon="tabler:book-2" className="text-[20px]" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="page-title">Riwayat Mengajar</h1>
                        <p className="page-subtitle">
                            Riwayat sesi mengajar, potensi gaji, dan riwayat pembayaran Anda
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Gaji"
                    value={formatCurrency(totalGaji)}
                    icon="tabler:wallet"
                    color="blue"
                />
                <StatCard
                    title="Total Sudah Dibayar"
                    value={formatCurrency(totalBayar)}
                    icon="tabler:circle-check"
                    color="green"
                />
                <StatCard
                    title="Gaji Bulan Ini"
                    value={gajiBulanIni ? formatCurrency(gajiBulanIni.total) : formatCurrency(0)}
                    icon="tabler:calendar-week"
                    color="purple"
                />
                <StatCard
                    title="Status Pembayaran"
                    value={belumBayar > 0 ? formatCurrency(belumBayar) : 'Lunas'}
                    icon="tabler:alert-triangle"
                    color={belumBayar > 0 ? 'amber' : 'green'}
                    description={belumBayar > 0 ? 'Belum dibayar' : 'Semua sudah dibayar'}
                />
            </div>

            {/* Riwayat Mengajar & Potensi Gaji */}
            <Card
                title="Riwayat Mengajar & Potensi Gaji"
                description={`Sesi mengajar terjadwal pada periode ${periodeLabel} beserta estimasi honor Anda`}
                className="mb-8"
            >
                <div className="mb-6 max-w-xs">
                    <Input
                        label="Periode"
                        type="month"
                        value={filters.periode ?? periodeDefault}
                        onChange={(e) => handlePeriodeChange(e.target.value)}
                    />
                </div>

                {!riwayat || riwayat.sessions.length === 0 ? (
                    <EmptyState
                        icon="tabler:calendar-stats"
                        title="Belum ada riwayat mengajar"
                        description={`Tidak ada sesi mengajar terjadwal pada periode ${periodeLabel}.`}
                    />
                ) : (
                    <>
                        {/* Ringkasan potensi */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Total Sesi</p>
                                <p className="text-lg font-extrabold text-indigo-700 mt-1">{riwayat.total_sesi}</p>
                            </div>
                            <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Kelas Khusus</p>
                                <p className="text-lg font-extrabold text-violet-700 mt-1">{riwayat.sesi_khusus}</p>
                            </div>
                            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Kelas Reguler</p>
                                <p className="text-lg font-extrabold text-sky-700 mt-1">{riwayat.sesi_reguler}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Potensi Gaji</p>
                                <p className="text-lg font-extrabold text-emerald-700 mt-1 break-words">{formatCurrency(riwayat.potensi_gaji)}</p>
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-14">No</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Pekan</TableHead>
                                        <TableHead>Jam</TableHead>
                                        <TableHead>Program / Kelas</TableHead>
                                        <TableHead>Bahan Ajar</TableHead>
                                        <TableHead>Lokasi</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {riwayat.sessions.map((s, index) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-semibold text-indigo-500">{index + 1}</TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium text-slate-900 block">{s.tanggal_label}</span>
                                                <span className="text-xs text-slate-400">{s.hari}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    Pekan {s.pekan}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600 whitespace-nowrap">{s.jam_mulai}–{s.jam_selesai}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${programStyle(s.program).badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${programStyle(s.program).dot}`} />
                                                    {s.program ?? s.mapel}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[240px]">
                                                <span className="text-sm text-slate-600 block truncate" title={s.bahan_ajar ?? ''}>
                                                    {s.bahan_ajar ?? '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">{s.lokasi}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={sesiStatusVariant[s.status] ?? 'default'} size="sm">
                                                    {sesiStatusLabel[s.status] ?? s.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {riwayat.sessions.map((s) => (
                                <div key={s.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 text-sm">{s.tanggal_label}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{s.hari} · {s.jam_mulai}–{s.jam_selesai}</p>
                                        </div>
                                        <Badge variant={sesiStatusVariant[s.status] ?? 'default'} size="sm">
                                            {sesiStatusLabel[s.status] ?? s.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${programStyle(s.program).badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${programStyle(s.program).dot}`} />
                                            {s.program ?? s.mapel}
                                        </span>
                                        <span className="text-xs text-slate-500">Pekan {s.pekan}</span>
                                        <span className="text-xs text-slate-500 truncate">{s.lokasi}</span>
                                    </div>
                                    {s.bahan_ajar && <p className="text-xs text-slate-500">{s.bahan_ajar}</p>}
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-slate-400 mt-4">
                            Potensi gaji = {riwayat.total_sesi} sesi terjadwal × honor per sesi grade + tunjangan khusus. Angka final mengikuti data presensi yang tervalidasi.
                        </p>
                    </>
                )}
            </Card>

            {/* Table */}
            <Card
                title="Riwayat Pembayaran Honor"
                description="Riwayat honor per periode beserta slip gaji yang dapat diunduh"
            >
                {penggajians.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">No</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead className="text-center">Sesi</TableHead>
                                        <TableHead className="text-center">Hadir</TableHead>
                                        <TableHead className="text-right">Honor</TableHead>
                                        <TableHead className="text-right">Transport</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Status Bayar</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {penggajians.map((pg, index) => (
                                        <TableRow key={pg.id}>
                                            <TableCell className="font-semibold text-indigo-500">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium text-slate-900">
                                                    {pg.periode}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm text-slate-600">{pg.jumlah_sesi}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm text-slate-600">{pg.jumlah_hadir}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm text-slate-900">{formatCurrency(pg.honor)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm text-slate-900">{formatCurrency(pg.total_transport)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-extrabold text-slate-900">{formatCurrency(pg.total)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[pg.status_bayar]?.variant || 'default'}>
                                                    {statusConfig[pg.status_bayar]?.label || pg.status_bayar}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <a
                                                    href={route('my-salary.payslip', pg.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                                                    title="Download Slip Gaji PDF"
                                                >
                                                    <Icon icon="tabler:download" className="text-[16px]" />
                                                    <span className="hidden sm:inline">Slip Gaji</span>
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Grand Total Row */}
                                    <TableRow className="bg-gradient-to-r from-indigo-50/80 to-violet-50/60">
                                        <TableCell colSpan={4} className="font-extrabold text-slate-900 text-right">
                                            Grand Total
                                        </TableCell>
                                        <TableCell className="text-right font-extrabold text-slate-900">
                                            {formatCurrency(penggajians.reduce((sum, pg) => sum + pg.honor, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-extrabold text-slate-900">
                                            {formatCurrency(penggajians.reduce((sum, pg) => sum + pg.total_transport, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-extrabold text-slate-900">
                                            {formatCurrency(totalGaji)}
                                        </TableCell>
                                        <TableCell />
                                        <TableCell />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {penggajians.map((pg, index) => (
                                <div
                                    key={pg.id}
                                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)]">
                                                <Icon icon="tabler:receipt" className="text-[18px]" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm break-words">{pg.periode}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 break-words">
                                                    {pg.jumlah_sesi} sesi &middot; {pg.jumlah_hadir} hadir
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                                            #{index + 1}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500">Honor</p>
                                            <p className="text-slate-700 font-medium break-words">{formatCurrency(pg.honor)}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500">Transport</p>
                                            <p className="text-slate-700 font-medium break-words">{formatCurrency(pg.total_transport)}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500">Total</p>
                                            <p className="font-extrabold text-slate-900 break-words">{formatCurrency(pg.total)}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500">Status</p>
                                            <Badge variant={statusConfig[pg.status_bayar]?.variant || 'default'}>
                                                {statusConfig[pg.status_bayar]?.label || pg.status_bayar}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100">
                                        <a
                                            href={route('my-salary.payslip', pg.id)}
                                            className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/25 break-words"
                                        >
                                            <Icon icon="tabler:download" className="text-[16px] shrink-0" />
                                            Download Slip Gaji
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Grand Total */}
                            <div className="p-5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white space-y-3 shadow-brand-lg overflow-hidden">
                                <p className="text-sm font-semibold">Grand Total</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="text-white/70 text-xs">Honor</p>
                                        <p className="font-extrabold break-words">{formatCurrency(penggajians.reduce((sum, pg) => sum + pg.honor, 0))}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white/70 text-xs">Transport</p>
                                        <p className="font-extrabold break-words">{formatCurrency(penggajians.reduce((sum, pg) => sum + pg.total_transport, 0))}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-white/20">
                                    <p className="text-xs text-white/70">Total Keseluruhan</p>
                                    <p className="text-lg sm:text-xl font-extrabold break-words">{formatCurrency(totalGaji)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon="tabler:wallet"
                        title="Belum ada data penggajian"
                        description="Data penggajian akan muncul setelah Anda memiliki riwayat mengajar."
                    />
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
