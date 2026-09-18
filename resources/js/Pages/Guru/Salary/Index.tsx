import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import { Head } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Penggajian, Guru } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface SalaryIndexProps {
    penggajians: Penggajian[];
    guru: Guru;
    totalGaji: number;
    totalBayar: number;
    gajiBulanIni: Penggajian | null;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' }> = {
    belum_dibayar: { label: 'Belum Dibayar', variant: 'danger' },
    sudah_dibayar: { label: 'Sudah Dibayar', variant: 'success' },
};

export default function SalaryIndex({ penggajians, guru, totalGaji, totalBayar, gajiBulanIni }: SalaryIndexProps) {
    const belumBayar = totalGaji - totalBayar;

    return (
        <AuthenticatedLayout>
            <Head title="Penggajian" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Penggajian</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ringkasan penggajian dan riwayat pembayaran Anda
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Gaji"
                    value={formatCurrency(totalGaji)}
                    icon="lucide:wallet"
                    color="blue"
                />
                <StatCard
                    title="Total Sudah Dibayar"
                    value={formatCurrency(totalBayar)}
                    icon="lucide:check-circle"
                    color="green"
                />
                <StatCard
                    title="Gaji Bulan Ini"
                    value={gajiBulanIni ? formatCurrency(gajiBulanIni.total) : formatCurrency(0)}
                    icon="lucide:calendar"
                    color="purple"
                />
                <StatCard
                    title="Status Pembayaran"
                    value={belumBayar > 0 ? formatCurrency(belumBayar) : 'Lunas'}
                    icon="lucide:alert-circle"
                    color={belumBayar > 0 ? 'amber' : 'green'}
                    description={belumBayar > 0 ? 'Belum dibayar' : 'Semua sudah dibayar'}
                />
            </div>

            {/* Table */}
            <Card>
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
                                            <TableCell className="font-medium text-slate-400">
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
                                                <span className="text-sm font-semibold text-slate-900">{formatCurrency(pg.total)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[pg.status_bayar]?.variant || 'default'}>
                                                    {statusConfig[pg.status_bayar]?.label || pg.status_bayar}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <a
                                                    href={route('my-salary.payslip', pg.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Download Slip Gaji PDF"
                                                >
                                                    <Icon icon="lucide:download" className="text-sm" />
                                                    <span className="hidden sm:inline">Slip Gaji</span>
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Grand Total Row */}
                                    <TableRow className="bg-slate-50">
                                        <TableCell colSpan={4} className="font-bold text-slate-900 text-right">
                                            Grand Total
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {formatCurrency(penggajians.reduce((sum, pg) => sum + pg.honor, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {formatCurrency(penggajians.reduce((sum, pg) => sum + pg.total_transport, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {formatCurrency(totalGaji)}
                                        </TableCell>
                                        <TableCell />
                                        <TableCell />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {penggajians.map((pg, index) => (
                                <div
                                    key={pg.id}
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{pg.periode}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {pg.jumlah_sesi} sesi &middot; {pg.jumlah_hadir} hadir
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400">Honor</p>
                                            <p className="text-slate-700">{formatCurrency(pg.honor)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Transport</p>
                                            <p className="text-slate-700">{formatCurrency(pg.total_transport)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Total</p>
                                            <p className="font-semibold text-slate-900">{formatCurrency(pg.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Status</p>
                                            <Badge variant={statusConfig[pg.status_bayar]?.variant || 'default'}>
                                                {statusConfig[pg.status_bayar]?.label || pg.status_bayar}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200/60">
                                        <a
                                            href={route('my-salary.payslip', pg.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:download" className="text-xs" />
                                            Download Slip Gaji
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Grand Total */}
                            <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2">
                                <p className="text-sm font-semibold">Grand Total</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-slate-300 text-xs">Honor</p>
                                        <p>{formatCurrency(penggajians.reduce((sum, pg) => sum + pg.honor, 0))}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-300 text-xs">Transport</p>
                                        <p>{formatCurrency(penggajians.reduce((sum, pg) => sum + pg.total_transport, 0))}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                    <p className="text-xs text-slate-300">Total Keseluruhan</p>
                                    <p className="text-lg font-bold">{formatCurrency(totalGaji)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Icon icon="lucide:wallet" className="text-3xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Belum ada data penggajian</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            Data penggajian akan muncul setelah Anda memiliki riwayat mengajar.
                        </p>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
