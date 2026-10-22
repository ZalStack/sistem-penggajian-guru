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

            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
                <div className="flex items-start gap-3.5 min-w-0">
                    <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:wallet" className="text-xl" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="page-title">Penggajian</h1>
                        <p className="page-subtitle">
                            Ringkasan penggajian dan riwayat pembayaran Anda
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                                                    <Icon icon="lucide:download" className="text-sm" />
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
                                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(79,70,229,0.05)] hover:border-indigo-200 hover:shadow-[0_10px_24px_rgba(79,70,229,0.12)] transition-all space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)]">
                                                <Icon icon="lucide:receipt-text" className="text-lg" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm break-words">{pg.periode}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 break-words">
                                                    {pg.jumlah_sesi} sesi &middot; {pg.jumlah_hadir} hadir
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
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

                                    <div className="pt-3 border-t border-indigo-100/70">
                                        <a
                                            href={route('my-salary.payslip', pg.id)}
                                            className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/25 break-words"
                                        >
                                            <Icon icon="lucide:download" className="text-sm shrink-0" />
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
                    <div className="text-center py-16 sm:py-20 px-2">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto mb-4 shadow-[0_12px_26px_-8px_rgba(99,102,241,0.7)]">
                            <Icon icon="lucide:wallet" className="text-3xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Belum ada data penggajian</h3>
                        <p className="text-sm text-slate-500 mt-1 mx-auto max-w-sm break-words">
                            Data penggajian akan muncul setelah Anda memiliki riwayat mengajar.
                        </p>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
