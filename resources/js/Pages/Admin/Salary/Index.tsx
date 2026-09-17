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
}

export default function SalaryIndex({ penggajians, gurus, filters }: SalaryIndexProps) {
    const calculateForm = useForm({
        periode: filters.periode ?? '',
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

    const totalGaji = penggajians.reduce((sum, p) => sum + p.total, 0);
    const sudahDibayar = penggajians
        .filter((p) => p.status_bayar === 'sudah_dibayar')
        .reduce((sum, p) => sum + p.total, 0);
    const belumDibayar = penggajians
        .filter((p) => p.status_bayar === 'belum_dibayar')
        .reduce((sum, p) => sum + p.total, 0);

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Penggajian" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Penggajian Guru</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Hitung honor guru dan kelola status pembayaran gaji
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('penggajian.index')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                    >
                        <Icon icon="lucide:sliders" className="text-base" />
                        <span>Input Manual & Arsip</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="Total Gaji"
                    value={formatCurrency(totalGaji)}
                    icon="lucide:wallet"
                    color="blue"
                    description="Seluruh periode"
                />
                <StatCard
                    title="Sudah Dibayar"
                    value={formatCurrency(sudahDibayar)}
                    icon="lucide:check-circle"
                    color="green"
                    description="Total pembayaran lunas"
                />
                <StatCard
                    title="Belum Dibayar"
                    value={formatCurrency(belumDibayar)}
                    icon="lucide:clock"
                    color="amber"
                    description="Menunggu pembayaran"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card title="Filter Data" description="Saring data penggajian sesuai kebutuhan">
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
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Status Bayar</label>
                            <select
                                value={filters.status_bayar ?? ''}
                                onChange={(e) => handleFilterChange('status_bayar', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors duration-200 shadow-sm cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                <option value="belum_dibayar">Belum Dibayar</option>
                                <option value="sudah_dibayar">Sudah Dibayar</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <Card title="Hitung Gaji" description="Masukkan periode untuk menghitung gaji guru">
                    <form onSubmit={handleCalculate} className="flex items-end gap-4">
                        <div className="flex-1">
                            <Input
                                label="Periode"
                                type="month"
                                value={calculateForm.data.periode}
                                onChange={(e) => calculateForm.setData('periode', e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" processing={calculateForm.processing} className="mb-0.5 shadow-sm">
                            <Icon icon="lucide:calculator" className="text-base" />
                            Hitung Gaji
                        </Button>
                    </form>
                </Card>
            </div>

            <Card
                title="Daftar Penggajian"
                description={`Menampilkan ${penggajians.length} data penggajian`}
            >
                {/* Desktop Table */}
                <div className="hidden xl:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">No</TableHead>
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
                                        <div className="text-center py-12">
                                            <Icon
                                                icon="lucide:inbox"
                                                className="text-4xl text-slate-300 mx-auto mb-3"
                                            />
                                            <p className="text-sm text-slate-500">
                                                Tidak ada data penggajian ditemukan
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                penggajians.map((p, index) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium text-slate-400">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Icon icon="lucide:user" className="text-base" />
                                                </div>
                                                <span className="font-medium text-slate-900">
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
                                            <span className="text-slate-700 font-mono text-xs">
                                                {p.periode}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-slate-700">{p.jumlah_sesi}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-slate-700">{p.jumlah_hadir}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-700">{p.total_jam} jam</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-slate-900">
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
                                                <Badge variant="success">Sudah Dibayar</Badge>
                                            ) : (
                                                <Badge variant="danger">Belum Dibayar</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('penggajian.show', p.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                                    title="Lihat & Cetak Slip Gaji"
                                                >
                                                    <Icon icon="lucide:printer" className="text-sm" />
                                                    <span className="hidden sm:inline">Slip</span>
                                                </Link>
                                                {p.status_bayar === 'belum_dibayar' && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handlePay(p.id)}
                                                        className="shadow-sm"
                                                    >
                                                        <Icon icon="lucide:credit-card" className="text-base" />
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

                {/* Mobile Cards */}
                <div className="xl:hidden space-y-3">
                    {penggajians.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon icon="lucide:inbox" className="text-4xl text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">Tidak ada data penggajian ditemukan</p>
                        </div>
                    ) : (
                        penggajians.map((p, index) => (
                            <div
                                key={p.id}
                                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Icon icon="lucide:user" className="text-base" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">
                                                {p.guru?.nama ?? '-'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Grade {p.guru?.grade?.kode_grade ?? '-'} &middot;{' '}
                                                {p.periode}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-400">
                                            #{index + 1}
                                        </span>
                                        {p.status_bayar === 'sudah_dibayar' ? (
                                            <Badge variant="success">Dibayar</Badge>
                                        ) : (
                                            <Badge variant="danger">Belum</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-400">Sesi / Hadir</p>
                                        <p className="font-medium text-slate-700">
                                            {p.jumlah_sesi} / {p.jumlah_hadir}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Total Jam</p>
                                        <p className="font-medium text-slate-700">{p.total_jam} jam</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Transport</p>
                                        <p className="font-medium text-slate-700">
                                            {formatCurrency(p.total_transport)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                    <div>
                                        <p className="text-xs text-slate-400">Honor</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {formatCurrency(p.honor)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Total</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {formatCurrency(p.total)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={route('penggajian.show', p.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:printer" className="text-xs" />
                                            Slip
                                        </Link>
                                        {p.status_bayar === 'belum_dibayar' && (
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handlePay(p.id)}
                                                className="shadow-sm"
                                            >
                                                <Icon icon="lucide:credit-card" className="text-base" />
                                                Bayar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
