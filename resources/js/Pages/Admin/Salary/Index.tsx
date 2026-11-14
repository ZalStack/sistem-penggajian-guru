import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import Select from '@/Components/ui/select';
import Pagination from '@/Components/ui/pagination';
import EmptyState from '@/Components/ui/empty-state';
import { programStyle } from '@/lib/program-colors';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Fragment, useState } from 'react';
import { Penggajian, Guru, Grade, PaginatedData, RiwayatMengajarMap, EffectiveSessionStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Ringkasan {
    total_guru: number;
    total_honor: number;
    total_transport: number;
    total_tunjangan: number;
    grand_total: number;
    sudah_dibayar: number;
    belum_dibayar: number;
    nominal_belum_dibayar: number;
    total_sesi: number;
    total_hadir: number;
}

interface SalaryIndexProps {
    penggajians: PaginatedData<Penggajian>;
    gurus: (Guru & { grade?: Grade })[];
    filters: {
        periode?: string;
        filter_guru?: string;
        status_bayar?: string;
        search?: string;
    };
    periodeDefault: string;
    periodeAktif: string;
    riwayatMengajar: RiwayatMengajarMap;
    ringkasan: Ringkasan;
}

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

export default function SalaryIndex({ penggajians, gurus, filters, periodeDefault, periodeAktif, riwayatMengajar, ringkasan }: SalaryIndexProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [riwayatOpenId, setRiwayatOpenId] = useState<number | null>(null);

    const calculateForm = useForm({
        periode: filters.periode ?? periodeDefault,
        guru_id: filters.filter_guru ?? '',
    });

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('penggajian.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        calculateForm.post(route('penggajian.calculate'), {
            preserveScroll: true,
            onSuccess: () => {
                router.reload();
            },
        });
    };

    const handlePay = (id: number) => {
        router.post(route('penggajian.pay', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload();
            },
        });
    };

    const periodeLabel = new Date(periodeAktif + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const riwayatEntries = Object.entries(riwayatMengajar ?? {}).map(([guruId, riwayat]) => ({
        guruId: Number(guruId),
        nama: gurus.find((g) => g.id === Number(guruId))?.nama ?? '-',
        ...riwayat,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Penggajian Guru" />

            {/* Page Header */}
            <div className="page-header animate-fade-in mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/40">
                        <Icon icon="tabler:wallet" className="text-[18px]" />
                    </div>
                    <h1 className="page-title">Penggajian Guru</h1>
                </div>
                <p className="page-subtitle mt-1">
                    Rekap honor per guru per periode, dihitung otomatis dari sesi mengajar yang tervalidasi lewat presensi.
                </p>
            </div>

            {/* Stat Cards — Ringkasan Periode Aktif */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                    title={`Total Honor (${periodeLabel})`}
                    value={formatCurrency(ringkasan.grand_total)}
                    icon="tabler:wallet"
                    color="slate"
                    description={`Honor ${formatCurrency(ringkasan.total_honor)} + transport ${formatCurrency(ringkasan.total_transport)}`}
                    className="break-words"
                />
                <StatCard
                    title="Sudah Dibayar"
                    value={formatCurrency(ringkasan.grand_total - ringkasan.nominal_belum_dibayar)}
                    icon="tabler:circle-check"
                    color="success"
                    description={`${ringkasan.sudah_dibayar} dari ${ringkasan.total_guru} guru`}
                    className="break-words"
                />
                <StatCard
                    title="Belum Dibayar"
                    value={formatCurrency(ringkasan.nominal_belum_dibayar)}
                    icon="tabler:clock"
                    color="warning"
                    description={`${ringkasan.belum_dibayar} guru menunggu pembayaran`}
                    className="break-words"
                />
            </div>

            {/* Filter & Hitung Gaji */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
                <Card title="Filter Data" description="Saring rekap honor sesuai kebutuhan" className="xl:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        <Input
                            label="Cari Nama"
                            value={filters.search ?? ''}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Nama guru…"
                        />
                        <Input
                            label="Periode"
                            type="month"
                            value={filters.periode ?? ''}
                            onChange={(e) => handleFilterChange('periode', e.target.value)}
                        />
                        <Select
                            label="Guru"
                            value={filters.filter_guru ?? ''}
                            onChange={(e) => handleFilterChange('filter_guru', e.target.value)}
                            options={gurus.map((g) => ({ value: g.id, label: g.nama }))}
                            placeholder="Semua Guru"
                        />
                        <Select
                            label="Status Bayar"
                            value={filters.status_bayar ?? ''}
                            onChange={(e) => handleFilterChange('status_bayar', e.target.value)}
                            options={[
                                { value: 'belum_dibayar', label: 'Belum Dibayar' },
                                { value: 'sudah_dibayar', label: 'Sudah Dibayar' },
                            ]}
                            placeholder="Semua Status"
                        />
                    </div>
                </Card>

                <Card title="Hitung Ulang Gaji" description="Perbarui rekap dari data presensi & sesi valid" className="xl:col-span-2">
                    <form onSubmit={handleCalculate} className="space-y-5">
                        <Input
                            label="Periode"
                            type="month"
                            value={calculateForm.data.periode}
                            onChange={(e) => calculateForm.setData('periode', e.target.value)}
                            error={calculateForm.errors.periode}
                            required
                        />
                        <Select
                            label="Guru (opsional)"
                            value={calculateForm.data.guru_id}
                            onChange={(e) => calculateForm.setData('guru_id', e.target.value)}
                            options={gurus.map((g) => ({ value: g.id, label: g.nama }))}
                            placeholder="Semua guru"
                            error={calculateForm.errors.guru_id}
                        />
                        <Button type="submit" processing={calculateForm.processing} className="w-full justify-center py-3">
                            <Icon icon="tabler:calculator" className="text-[18px]" />
                            Hitung Gaji Sekarang
                        </Button>
                        <p className="text-xs text-center text-slate-500">
                            Perhitungan otomatis dari jumlah sesi hadir × honor grade + transport + tunjangan khusus.
                        </p>
                    </form>
                </Card>
            </div>

            {/* Riwayat Mengajar & Potensi Gaji */}
            <Card
                title="Riwayat Mengajar & Potensi Gaji"
                description={`Sesi mengajar terjadwal pada periode ${periodeLabel} beserta estimasi honor per guru`}
                className="mb-8"
            >
                {riwayatEntries.length === 0 ? (
                    <EmptyState
                        icon="tabler:calendar-stats"
                        title="Belum ada riwayat mengajar"
                        description="Tidak ada sesi mengajar terjadwal pada periode ini."
                    />
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto -mx-5 sm:-mx-7 lg:-mx-8">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-14">No</TableHead>
                                        <TableHead>Guru</TableHead>
                                        <TableHead className="text-center">Total Sesi</TableHead>
                                        <TableHead className="text-center">Kelas Khusus</TableHead>
                                        <TableHead className="text-center">Kelas Reguler</TableHead>
                                        <TableHead>Potensi Gaji</TableHead>
                                        <TableHead className="text-right">Riwayat</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {riwayatEntries.map((r, index) => (
                                        <Fragment key={r.guruId}>
                                            <TableRow className="hover:bg-indigo-50/40">
                                                <TableCell className="font-medium text-slate-400 text-sm">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-lg shadow-indigo-900/40">
                                                            {r.nama.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-900 text-sm">{r.nama}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                                        {r.total_sesi}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                                                        {r.sesi_khusus}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                                                        {r.sesi_reguler}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-slate-900">{formatCurrency(r.potensi_gaji)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => setRiwayatOpenId(riwayatOpenId === r.guruId ? null : r.guruId)}
                                                        className="shadow-sm"
                                                    >
                                                        <Icon icon={riwayatOpenId === r.guruId ? 'tabler:chevron-up' : 'tabler:calendar-stats'} className="text-[15px]" />
                                                        {riwayatOpenId === r.guruId ? 'Tutup' : 'Lihat Sesi'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {riwayatOpenId === r.guruId && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="bg-slate-50/70 p-0">
                                                        <div className="px-6 py-4">
                                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                                                Riwayat Mengajar Lengkap — {r.nama}
                                                            </p>
                                                            {r.sessions.length > 0 ? (
                                                                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                                                                                <th className="px-4 py-2.5 font-[600]">Tanggal</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Pekan</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Jam</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Program / Kelas</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Bahan Ajar</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Lokasi</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Status</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50">
                                                                            {r.sessions.map((s) => (
                                                                                <tr key={s.id}>
                                                                                    <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                                                                                        {s.hari}, {s.tanggal_label}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-slate-600">Pekan {s.pekan}</td>
                                                                                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                                                                                        {s.jam_mulai}–{s.jam_selesai}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5">
                                                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${programStyle(s.program).badge}`}>
                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${programStyle(s.program).dot}`} />
                                                                                            {s.program ?? s.mapel}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-slate-600 max-w-[220px] truncate" title={s.bahan_ajar ?? ''}>
                                                                                        {s.bahan_ajar ?? '-'}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-slate-600">{s.lokasi}</td>
                                                                                    <td className="px-4 py-2.5">
                                                                                        <Badge variant={sesiStatusVariant[s.status] ?? 'default'} size="sm">
                                                                                            {sesiStatusLabel[s.status] ?? s.status}
                                                                                        </Badge>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-slate-500">Belum ada riwayat mengajar pada periode ini.</p>
                                                            )}
                                                            <p className="text-xs text-slate-400 mt-3">
                                                                Potensi gaji = {r.total_sesi} sesi terjadwal × honor per sesi grade + tunjangan khusus.
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {riwayatEntries.map((r) => (
                                <div key={r.guruId} className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-900/40">
                                            {r.nama.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">{r.nama}</p>
                                            <p className="text-xs text-slate-500">{r.total_sesi} sesi terjadwal</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-indigo-50 rounded-xl py-2 border border-indigo-100">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">Total</p>
                                            <p className="text-sm font-bold text-indigo-700 mt-0.5">{r.total_sesi}</p>
                                        </div>
                                        <div className="bg-violet-50 rounded-xl py-2 border border-violet-100">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">Khusus</p>
                                            <p className="text-sm font-bold text-violet-700 mt-0.5">{r.sesi_khusus}</p>
                                        </div>
                                        <div className="bg-sky-50 rounded-xl py-2 border border-sky-100">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-500">Reguler</p>
                                            <p className="text-sm font-bold text-sky-700 mt-0.5">{r.sesi_reguler}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl px-3.5 py-2.5 text-white">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-white/80">Potensi Gaji</span>
                                        <span className="text-sm font-bold break-words">{formatCurrency(r.potensi_gaji)}</span>
                                    </div>

                                    {r.sessions.length > 0 ? (
                                        <div className="rounded-xl border border-slate-200 divide-y divide-slate-50 max-h-64 overflow-y-auto">
                                            {r.sessions.map((s) => (
                                                <div key={s.id} className="px-3.5 py-2.5 text-xs space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-semibold text-slate-800">
                                                            {s.tanggal_label} · {s.jam_mulai}–{s.jam_selesai}
                                                        </span>
                                                        <Badge variant={sesiStatusVariant[s.status] ?? 'default'} size="sm">
                                                            {sesiStatusLabel[s.status] ?? s.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${programStyle(s.program).badge}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${programStyle(s.program).dot}`} />
                                                            {s.program ?? s.mapel}
                                                        </span>
                                                        <span className="text-slate-500">Pekan {s.pekan}</span>
                                                    </div>
                                                    {s.bahan_ajar && <p className="text-slate-500 truncate">{s.bahan_ajar}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 text-center py-2">Belum ada riwayat mengajar pada periode ini.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            {/* Tabel Rekap */}
            <Card
                title="Daftar Rekap Honor"
                description={`Menampilkan ${penggajians.total} rekap honor${filters.periode ? ` periode ${periodeLabel}` : ' seluruh periode'}`}
            >
                {penggajians.data.length === 0 ? (
                    <EmptyState
                        icon="tabler:wallet-off"
                        title="Tidak ada data penggajian"
                        description="Gunakan filter atau hitung gaji untuk periode baru."
                    />
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto -mx-5 sm:-mx-7 lg:-mx-8">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-14">No</TableHead>
                                        <TableHead>Guru</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead className="text-center">Sesi</TableHead>
                                        <TableHead className="text-center">Hadir</TableHead>
                                        <TableHead>Honor</TableHead>
                                        <TableHead>Transport</TableHead>
                                        <TableHead>Tunjangan</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {penggajians.data.map((p, index) => (
                                        <Fragment key={p.id}>
                                            <TableRow className="hover:bg-indigo-50/40">
                                                <TableCell className="font-medium text-slate-400 text-sm">
                                                    {(penggajians.current_page - 1) * penggajians.per_page + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                                        className="flex items-center gap-3 text-left group"
                                                        title="Lihat rincian perhitungan"
                                                        aria-label="Lihat rincian perhitungan"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-lg shadow-indigo-900/40">
                                                            {p.guru?.nama?.substring(0, 2).toUpperCase() ?? 'GU'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-semibold text-slate-900 block truncate group-hover:text-indigo-700 transition-colors">
                                                                {p.guru?.nama ?? '-'}
                                                            </span>
                                                            <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                                                                <Icon icon={expandedId === p.id ? 'tabler:chevron-up' : 'tabler:chevron-down'} className="text-xs" />
                                                                Rincian perhitungan
                                                            </span>
                                                        </div>
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-700 font-mono text-xs bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                                                        {p.periode}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{p.jumlah_sesi}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-slate-700 font-medium">{p.jumlah_hadir}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-slate-900">
                                                        {formatCurrency(p.honor)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600">
                                                        {formatCurrency(p.total_transport)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600">
                                                        {formatCurrency(p.tunjangan_khusus)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-slate-900">
                                                        {formatCurrency(p.total)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {p.status_bayar === 'sudah_dibayar' ? (
                                                        <Badge variant="success">Lunas</Badge>
                                                    ) : (
                                                        <Badge variant="warning">Belum</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={route('penggajian.payslip', p.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl transition-colors shadow-sm"
                                                            title="Unduh Slip Gaji PDF"
                                                        >
                                                            <Icon icon="tabler:download" className="text-[14px]" />
                                                            PDF
                                                        </a>
                                                        {p.status_bayar === 'belum_dibayar' && (
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={() => handlePay(p.id)}
                                                                className="shadow-sm px-4"
                                                            >
                                                                <Icon icon="tabler:credit-card" className="text-[16px]" />
                                                                Bayar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {expandedId === p.id && (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="bg-indigo-50/40 p-0">
                                                         <div className="px-6 py-4">
                                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                                                Rincian Per Program &amp; Transport
                                                            </p>
                                                            {p.detail && p.detail.length > 0 ? (
                                                                <div className="rounded-xl border border-indigo-100 bg-white overflow-hidden">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                                                                                <th className="px-4 py-2.5 font-[600]">Program</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Transport</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-center">Sesi</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-center">Hadir</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-right">Honor</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-right">Transport</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-right">Subtotal</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50">
                                                                            {p.detail.map((d, i) => (
                                                                                <tr key={i}>
                                                                                    <td className="px-4 py-2.5">
                                                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${programStyle(d.program).badge}`}>
                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${programStyle(d.program).dot}`} />
                                                                                            {d.program}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-slate-600">{d.transport}</td>
                                                                                    <td className="px-4 py-2.5 text-center text-slate-600">{d.jumlah_sesi}</td>
                                                                                    <td className="px-4 py-2.5 text-center text-slate-600">{d.jumlah_hadir}</td>
                                                                                    <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(d.honor)}</td>
                                                                                    <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(d.transport_biaya)}</td>
                                                                                    <td className="px-4 py-2.5 text-right font-[700] text-slate-900">{formatCurrency(d.total)}</td>
                                                                                </tr>
                                                                            ))}
                                                                            {Number(p.tunjangan_khusus) > 0 && (
                                                                                <tr>
                                                                                    <td className="px-4 py-2.5 font-[600] text-slate-800" colSpan={6}>
                                                                                        Tunjangan Khusus
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-right font-[700] text-slate-900">
                                                                                        {formatCurrency(p.tunjangan_khusus)}
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-slate-500">
                                                                    Tidak ada rincian program — honor dihitung langsung dari total kehadiran.
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-slate-400 mt-3">
                                                                Data dihitung dari presensi valid pada periode {p.periode}. Baris yang sudah dibayar tidak dihitung ulang.
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-4">
                            {penggajians.data.map((p) => (
                                <div
                                    key={p.id}
                                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all space-y-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-900/40">
                                                {p.guru?.nama?.substring(0, 2).toUpperCase() ?? 'GU'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {p.guru?.nama ?? '-'}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Grade {p.guru?.grade?.kode_grade ?? '-'} • {p.periode} • {p.jumlah_sesi} sesi
                                                </p>
                                            </div>
                                        </div>
                                        {p.status_bayar === 'sudah_dibayar' ? (
                                            <Badge variant="success">Lunas</Badge>
                                        ) : (
                                            <Badge variant="warning">Belum</Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hadir</p>
                                            <p className="text-sm font-bold text-slate-900 mt-1">{p.jumlah_hadir} / {p.jumlah_sesi}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transport</p>
                                            <p className="text-sm font-bold text-slate-900 mt-1 break-words">{formatCurrency(p.total_transport)}</p>
                                        </div>
                                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-3 text-white shadow-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Total</p>
                                            <p className="text-sm font-bold mt-1 break-words">{formatCurrency(p.total)}</p>
                                        </div>
                                    </div>

                                    {p.detail && p.detail.length > 0 && (
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 divide-y divide-indigo-100/60">
                                            {p.detail.map((d, i) => (
                                                <div key={i} className="flex items-center justify-between px-3.5 py-2 text-xs gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-[700] text-slate-800 truncate">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${programStyle(d.program).badge}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${programStyle(d.program).dot}`} />
                                                                {d.program}
                                                            </span>
                                                        </p>
                                                        <p className="text-slate-500 truncate">{d.transport} · {d.jumlah_hadir} hadir</p>
                                                    </div>
                                                    <p className="font-[700] text-slate-900 shrink-0">{formatCurrency(d.total)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <a
                                            href={route('penggajian.payslip', p.id)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl transition-colors"
                                        >
                                            <Icon icon="tabler:download" className="text-[16px]" />
                                            Slip PDF
                                        </a>
                                        {p.status_bayar === 'belum_dibayar' && (
                                            <Button
                                                variant="success"
                                                onClick={() => handlePay(p.id)}
                                                className="flex-1 justify-center py-2.5"
                                            >
                                                <Icon icon="tabler:credit-card" className="text-[16px]" />
                                                Bayar Sekarang
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination links={penggajians.links} from={penggajians.from} to={penggajians.to} total={penggajians.total} />
                    </>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
