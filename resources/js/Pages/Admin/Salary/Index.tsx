import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Penggajian, Guru, Grade } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface SalaryIndexProps {
    penggajians: Penggajian[];
    gurus: (Guru & { grade?: Grade })[];
    filters: {
        periode?: string;
        filter_guru?: string;
        status_bayar?: string;
    };
    periodeDefault: string;
}

export default function SalaryIndex({ penggajians, gurus, filters, periodeDefault }: SalaryIndexProps) {
    const calculateForm = useForm({
        periode: filters.periode ?? periodeDefault,
    });

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('salary.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        calculateForm.post(route('salary.calculate'));
    };

    const handlePay = (id: number) => {
        router.post(route('salary.pay', id));
    };

    const totalGaji = penggajians.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const sudahDibayar = penggajians
        .filter((p) => p.status_bayar === 'sudah_dibayar')
        .reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const belumDibayar = penggajians
        .filter((p) => p.status_bayar === 'belum_dibayar')
        .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Penggajian — SIGURU" />

            {/* Header — spacious premium */}
            <div className="mb-10">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold tracking-wide uppercase text-slate-600 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Keuangan • Live
                        </div>
                        <h1 className="text-3xl sm:text-[32px] font-bold tracking-tight text-slate-900 leading-tight">Penggajian Guru</h1>
                        <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                            Hitung honor mengajar, kelola status pembayaran gaji, dan pantau realisasi dana secara transparan.
                        </p>
                    </div>
                    <Link
                        href={route('penggajian.index')}
                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm hover:shadow-md shrink-0"
                    >
                        <Icon icon="lucide:archive" className="w-4 h-4" />
                        Input Manual & Arsip
                    </Link>
                </div>
            </div>

            {/* Stats — generous gap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10">
                <StatCard
                    title="Total Gaji"
                    value={formatCurrency(totalGaji)}
                    icon="lucide:wallet"
                    color="slate"
                    description="Seluruh periode • Akumulasi"
                />
                <StatCard
                    title="Sudah Dibayar"
                    value={formatCurrency(sudahDibayar)}
                    icon="lucide:check-circle"
                    color="success"
                    description="Pembayaran lunas"
                />
                <StatCard
                    title="Belum Dibayar"
                    value={formatCurrency(belumDibayar)}
                    icon="lucide:clock"
                    color="warning"
                    description="Menunggu pembayaran"
                />
            </div>

            {/* Filters — spacious */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8 mb-10">
                <Card title="Filter Data" description="Saring data penggajian sesuai kebutuhan" className="xl:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <Input
                            label="Periode"
                            type="month"
                            value={filters.periode ?? ''}
                            onChange={(e) => handleFilterChange('periode', e.target.value)}
                        />
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Guru</label>
                            <select
                                value={filters.filter_guru ?? ''}
                                onChange={(e) => handleFilterChange('filter_guru', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 shadow-sm"
                            >
                                <option value="">Semua Guru</option>
                                {gurus.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Status Bayar</label>
                            <select
                                value={filters.status_bayar ?? ''}
                                onChange={(e) => handleFilterChange('status_bayar', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 shadow-sm"
                            >
                                <option value="">Semua Status</option>
                                <option value="belum_dibayar">Belum Dibayar</option>
                                <option value="sudah_dibayar">Sudah Dibayar</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <Card title="Hitung Gaji" description="Masukkan periode untuk menghitung otomatis" className="xl:col-span-2">
                    <form onSubmit={handleCalculate} className="space-y-5">
                        <Input
                            label="Periode"
                            type="month"
                            value={calculateForm.data.periode}
                            onChange={(e) => calculateForm.setData('periode', e.target.value)}
                            required
                        />
                        <Button type="submit" processing={calculateForm.processing} className="w-full justify-center py-3">
                            <Icon icon="lucide:calculator" className="w-4 h-4" />
                            Hitung Gaji Sekarang
                        </Button>
                        <p className="text-xs text-center text-slate-500">Perhitungan otomatis berdasarkan sesi hadir & grade</p>
                    </form>
                </Card>
            </div>

            {/* Table — spacious */}
            <Card
                title="Daftar Penggajian"
                description={`Menampilkan ${penggajians.length} data penggajian • Kelola pembayaran`}
            >
                {/* Desktop Table */}
                <div className="hidden xl:block -mx-8">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-14">No</TableHead>
                                <TableHead>Guru</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Periode</TableHead>
                                <TableHead className="text-center">Sesi</TableHead>
                                <TableHead className="text-center">Hadir</TableHead>
                                <TableHead>Total Jam</TableHead>
                                <TableHead>Honor</TableHead>
                                <TableHead>Transport</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {penggajians.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12}>
                                        <div className="text-center py-20">
                                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                <Icon icon="lucide:inbox" className="text-2xl" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900">Tidak ada data penggajian</p>
                                            <p className="text-xs text-slate-500 mt-1">Gunakan filter atau hitung gaji untuk periode baru</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                penggajians.map((p, index) => (
                                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium text-slate-400">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                                                    {p.guru?.nama?.substring(0,2).toUpperCase() ?? 'GU'}
                                                </div>
                                                <span className="font-semibold text-slate-900">
                                                    {p.guru?.nama ?? '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="info">
                                                {p.guru?.grade?.kode_grade ?? '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-700 font-mono text-xs bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                                                {p.periode}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold">{p.jumlah_sesi}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-slate-700 font-medium">{p.jumlah_hadir}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-600 text-sm">{p.total_jam} jam</span>
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
                                            <span className="font-bold text-slate-900">
                                                {formatCurrency(p.total)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {p.status_bayar === 'sudah_dibayar' ? (
                                                <Badge variant="success">Lunas</Badge>
                                            ) : (
                                                <Badge variant="danger">Belum</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={route('salary.payslip', p.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                                                    title="Download Slip Gaji PDF"
                                                >
                                                    <Icon icon="lucide:download" className="w-3.5 h-3.5" />
                                                    PDF
                                                </a>
                                                {p.status_bayar === 'belum_dibayar' && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handlePay(p.id)}
                                                        className="shadow-sm px-4"
                                                    >
                                                        <Icon icon="lucide:credit-card" className="w-4 h-4" />
                                                        Bayar
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Cards — spacious */}
                <div className="xl:hidden space-y-4">
                    {penggajians.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Icon icon="lucide:inbox" className="text-2xl" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">Tidak ada data</p>
                            <p className="text-xs text-slate-500 mt-1">Belum ada penggajian untuk periode ini</p>
                        </div>
                    ) : (
                        penggajians.map((p, index) => (
                            <div
                                key={p.id}
                                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs">
                                            {p.guru?.nama?.substring(0,2).toUpperCase() ?? 'GU'}
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
                                        <Badge variant="danger">Belum</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hadir</p>
                                        <p className="text-sm font-bold text-slate-900 mt-1">{p.jumlah_hadir} / {p.jumlah_sesi}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jam</p>
                                        <p className="text-sm font-bold text-slate-900 mt-1">{p.total_jam} jam</p>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl p-3 text-white">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">Total</p>
                                        <p className="text-sm font-bold mt-1">{formatCurrency(p.total)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <a
                                        href={route('salary.payslip', p.id)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        <Icon icon="lucide:download" className="w-4 h-4" />
                                        Slip PDF
                                    </a>
                                    {p.status_bayar === 'belum_dibayar' && (
                                        <Button
                                            variant="success"
                                            onClick={() => handlePay(p.id)}
                                            className="flex-1 justify-center py-2.5"
                                        >
                                            <Icon icon="lucide:credit-card" className="w-4 h-4" />
                                            Bayar Sekarang
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
